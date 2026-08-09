"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, ArrowUp, Check, RotateCcw, Loader2 } from "lucide-react";
import { useStore, docToText, appearancesFor } from "@/lib/store";
import {
  buildContext,
  localResponse,
  type CommandAction,
  COMMAND_ACTIONS,
} from "@/lib/ai";
import { Button, cx } from "@/components/ui/primitives";
import { validateNarrative } from "@/lib/game/validate";

const STATIC = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

type Result = {
  action: CommandAction;
  prompt: string;
  text: string;
  source: "model" | "local";
};

/**
 * Commands — the context-aware assistant.
 *
 * Output is always staged: nothing reaches the manuscript until the writer
 * presses Insert or Replace. There is no path where this component mutates a
 * scene on its own.
 */
export function Commands() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [action, setAction] = useState<CommandAction>(COMMAND_ACTIONS[0]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scenes = useStore((s) => s.scenes);
  const chapters = useStore((s) => s.chapters);
  const entities = useStore((s) => s.entities);
  const flows = useStore((s) => s.flows);
  const narrative = useStore((s) => s.narrative);
  const activeSceneId = useStore((s) => s.activeSceneId);
  const updateScene = useStore((s) => s.updateScene);

  const scene = scenes.find((s) => s.id === activeSceneId) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const report = useMemo(
    () => validateNarrative(narrative, entities),
    [narrative, entities],
  );

  const context = useMemo(
    () =>
      buildContext({
        scene,
        chapters,
        scenes,
        entities,
        flows,
        appearancesFor,
        narrative,
        report,
      }),
    [scene, chapters, scenes, entities, flows, narrative, report],
  );

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const offline = () =>
      setResult({
        action,
        prompt,
        text: localResponse(action.id, prompt, context),
        source: "local",
      });

    // The static build has no server to ask, so it goes straight to the
    // offline analysis rather than showing the writer a failed request.
    if (STATIC) {
      offline();
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, prompt, context }),
      });
      if (res.status === 404) {
        offline();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      setResult({ action, prompt, text: data.text, source: data.source });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  /** Append the staged text to the active scene as new paragraphs. */
  function insertBelow() {
    if (!result || !scene) return;
    const paras = result.text
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] }));
    const doc = scene.doc as { type: string; content?: unknown[] };
    updateScene(scene.id, {
      doc: { ...doc, content: [...(doc.content ?? []), ...paras] },
    });
    setResult(null);
    setOpen(false);
  }

  return (
    <>
      <button
        aria-label="Commands — AI assistant"
        title="Commands  (Ctrl/⌘ K)"
        onClick={() => setOpen(true)}
        className={cx(
          "group fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full",
          "border border-line2 bg-raise2 text-dim shadow-xl transition-all",
          "hover:border-accent/60 hover:text-accent hover:shadow-[0_0_28px_-6px_var(--ink-accent)]",
          open && "opacity-0",
        )}
      >
        <Sparkles size={22} strokeWidth={1.7} />
      </button>

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex max-h-[min(640px,85vh)] w-[min(440px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <h2 className="text-[16.9px] font-medium">Commands</h2>
            </div>
            <button
              aria-label="Close Commands"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-dim transition-colors hover:bg-raise2 hover:text-ink"
            >
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-2 text-[14.3px] text-faint">
              Context:{" "}
              <span className="text-dim">
                {scene ? scene.title : "no scene selected"}
                {context.entities.length > 0 &&
                  ` · ${context.entities.length} linked ${
                    context.entities.length === 1 ? "entity" : "entities"
                  }`}
                {context.game && context.game.quests.length > 0 &&
                  ` · ${context.game.quests.length} quests, ${context.game.variables.length} variables`}
              </span>
            </p>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {COMMAND_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAction(a)}
                  className={cx(
                    "rounded-md border px-2 py-1 text-[14.3px] transition-colors",
                    a.id === action.id
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-line2 text-dim hover:border-line2 hover:text-ink",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {result && (
              <div className="mb-3 rounded-xl border border-line2 bg-raise">
                <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                  <span className="text-[14.3px] text-dim">
                    Preview · {result.action.label}
                    {result.source === "local" && (
                      <span className="ml-1.5 text-faint">
                        (offline suggestions)
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setResult(null)}
                    aria-label="Reject suggestion"
                    className="text-faint transition-colors hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 text-[16.2px] leading-relaxed text-ink/90">
                  {result.text}
                </div>
                <div className="border-t border-line px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={insertBelow}
                      disabled={!scene}
                      className="shrink-0 whitespace-nowrap"
                    >
                      <Check size={16} /> Insert below
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={run}
                      className="shrink-0 whitespace-nowrap"
                    >
                      <RotateCcw size={16} /> Try again
                    </Button>
                  </div>
                  <p className="mt-1.5 text-[13.7px] text-faint">
                    Nothing is written until you accept.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-[15.6px] text-red-300">
                {error}
              </p>
            )}

            {!result && !busy && (
              <p className="text-[15.6px] leading-relaxed text-faint">
                {action.hint}
              </p>
            )}
          </div>

          <div className="border-t border-line p-3">
            <div className="relative">
              <textarea
                ref={inputRef}
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    run();
                  }
                }}
                placeholder={`${action.label}…  (Enter to run)`}
                className="ig-field w-full resize-none rounded-[10px] border border-line2 bg-raise py-2.5 pl-3 pr-11 text-[16.2px] outline-none placeholder:text-faint"
              />
              <button
                onClick={run}
                disabled={busy}
                aria-label="Run command"
                className="absolute bottom-2 right-2 grid h-7 w-7 place-items-center rounded-lg bg-accent text-black transition-opacity hover:opacity-85 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <ArrowUp size={17} />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[13px] text-faint">
              {STATIC
                ? "This build has no server, so nothing you write leaves the browser."
                : "Your writing is only sent to a model when one is configured for this deployment."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Exposed for the analysis panel on Home. */
export function sceneText(doc: unknown) {
  return docToText(doc);
}
