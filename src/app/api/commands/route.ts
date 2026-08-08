import { NextResponse } from "next/server";
import {
  COMMAND_ACTIONS,
  localResponse,
  systemPrompt,
  userPrompt,
  type AiContext,
} from "@/lib/ai";

export const runtime = "nodejs";

/** Crude per-process throttle. A real deployment puts this in Redis. */
const hits = new Map<string, number[]>();
const WINDOW = 60_000;
const LIMIT = 20;

function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > LIMIT;
}

function isContext(v: unknown): v is AiContext {
  return !!v && typeof v === "object" && "text" in v;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Give it a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, prompt, context } = (body ?? {}) as {
    action?: { id?: string; label?: string };
    prompt?: unknown;
    context?: unknown;
  };

  const known = COMMAND_ACTIONS.find((a) => a.id === action?.id);
  if (!known) {
    return NextResponse.json({ error: "Unknown command" }, { status: 400 });
  }
  if (!isContext(context)) {
    return NextResponse.json({ error: "Missing context" }, { status: 400 });
  }
  const note = typeof prompt === "string" ? prompt.slice(0, 2000) : "";

  const gemini = process.env.GEMINI_API_KEY;
  const openai = process.env.OPENAI_API_KEY;

  try {
    if (gemini) {
      const text = await callGemini(gemini, known.label, note, context);
      if (text) return NextResponse.json({ text, source: "model" });
    }
    if (openai) {
      const text = await callOpenAI(openai, known.label, note, context);
      if (text) return NextResponse.json({ text, source: "model" });
    }
  } catch {
    // Fall through — a provider outage should never block the writer.
  }

  return NextResponse.json({
    text: localResponse(known.id, note, context),
    source: "local",
  });
}

async function callGemini(
  key: string,
  label: string,
  note: string,
  ctx: AiContext,
): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt() }] },
        contents: [
          { role: "user", parts: [{ text: userPrompt(label, note, ctx) }] },
        ],
        generationConfig: { temperature: 0.85, maxOutputTokens: 900 },
      }),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  return text || null;
}

async function callOpenAI(
  key: string,
  label: string,
  note: string,
  ctx: AiContext,
): Promise<string | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.85,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(label, note, ctx) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return text || null;
}
