"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Maximize2, Plus, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "@/components/board/BoardBar";
import { Button, cx, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { TEMPLATES, templateById } from "@/lib/flowTemplates";
import type { FlowDirection, FlowScope, FlowTemplateId } from "@/lib/types";
import { routes } from "@/lib/routes";

const QUICK: FlowTemplateId[] = ["story", "relationship", "timeline"];

export function CreateFlow() {
  const hydrated = useHydrated();
  const router = useRouter();
  const addFlow = useStore((s) => s.addFlow);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<"template" | "scratch">("template");
  const [template, setTemplate] = useState<FlowTemplateId>("story");
  const [browsing, setBrowsing] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<FlowScope>("Entire Story");
  const [direction, setDirection] = useState<FlowDirection>("Linear");
  const [goal, setGoal] = useState("");
  const [touched, setTouched] = useState(false);

  function create() {
    setTouched(true);
    const trimmed = name.trim();
    if (!trimmed) return;
    const chosen: FlowTemplateId = mode === "scratch" ? "scratch" : template;
    const { nodes, edges } = templateById(chosen).build();
    const id = addFlow({
      name: trimmed,
      template: chosen,
      description,
      scope,
      direction,
      goal,
      nodes,
      edges,
    });
    router.push(routes.flowView(id));
  }

  if (!hydrated) return <div className="h-full" />;

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[{ label: "All", href: "/flow" }]}
        createLabel="Create"
        onCreate={create}
        trailing={<Maximize2 size={11} className="text-faint" />}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-10 pt-6 sm:px-5 sm:pt-10">
        <div className="mx-auto w-full max-w-[640px]">
          <label className="mb-1.5 block text-[14px] text-dim" htmlFor="flow-name">
            Flow name
          </label>
          <Input
            id="flow-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="h-11 rounded-xl"
            aria-invalid={touched && !name.trim()}
          />
          {touched && !name.trim() && (
            <p className="mt-1.5 text-[11.5px] text-red-300">
              Give the flow a name first.
            </p>
          )}

          <p className="mb-3 mt-6 text-[14px] text-dim">
            Select a starting point:
          </p>

          <div
            role="radiogroup"
            aria-label="Starting point"
            className="grid gap-4 sm:grid-cols-2 sm:gap-6"
          >
            {/* ---- templates ---- */}
            <div
              role="radio"
              aria-checked={mode === "template"}
              tabIndex={0}
              onClick={() => setMode("template")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setMode("template");
                }
              }}
              className={cx(
                "cursor-pointer rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                mode === "template"
                  ? "border-accent/60 bg-raise shadow-[0_0_40px_-24px_var(--ink-accent)]"
                  : "border-line2 bg-raise/60 hover:border-line2",
              )}
            >
              <div className="flex items-start gap-2.5">
                <TemplatesGlyph active={mode === "template"} />
                <div>
                  <p className="text-[15px] font-semibold leading-tight">
                    Templates
                  </p>
                  <p className="text-[11px] text-faint">Use a pre-made flow</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {QUICK.map((id) => {
                  const t = templateById(id);
                  const active = mode === "template" && template === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("template");
                        setTemplate(id);
                      }}
                      className={cx(
                        "flex flex-col items-center gap-1.5 rounded-lg border px-1.5 py-3 text-center transition-all",
                        active
                          ? "border-accent/70 bg-accent/[0.07]"
                          : "border-line2 bg-void hover:border-line2",
                      )}
                    >
                      <TemplateGlyph id={id} />
                      <span className="whitespace-nowrap text-[9px] font-medium leading-none tracking-tight">
                        {t.name}
                      </span>
                      <span className="text-[7.5px] leading-tight text-faint">
                        {t.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-expanded={browsing}
                onClick={(e) => {
                  e.stopPropagation();
                  setBrowsing((v) => !v);
                }}
                className="mt-3 block w-full text-center text-[12.5px] font-medium text-accent hover:text-accent-soft"
              >
                {browsing ? "− Fewer templates" : "+ Browse templates"}
              </button>

              {browsing && (
                <div className="mt-3 space-y-1.5">
                  {TEMPLATES.filter((t) => !QUICK.includes(t.id)).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={template === t.id && mode === "template"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("template");
                        setTemplate(t.id);
                      }}
                      className={cx(
                        "flex w-full items-baseline justify-between rounded-lg border px-2.5 py-1.5 transition-colors",
                        template === t.id && mode === "template"
                          ? "border-accent/70 bg-accent/[0.07]"
                          : "border-line2 hover:border-line2",
                      )}
                    >
                      <span className="text-[11.5px]">{t.name}</span>
                      <span className="text-[10px] text-faint">{t.blurb}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ---- scratch ---- */}
            <div
              role="radio"
              aria-checked={mode === "scratch"}
              tabIndex={0}
              onClick={() => setMode("scratch")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setMode("scratch");
                }
              }}
              className={cx(
                "cursor-pointer rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                mode === "scratch"
                  ? "border-accent/60 bg-raise shadow-[0_0_40px_-24px_var(--ink-accent)]"
                  : "border-line2 bg-raise/60 hover:border-line2",
              )}
            >
              <div className="flex items-start gap-2.5">
                <ScratchGlyph active={mode === "scratch"} />
                <div>
                  <p className="text-[15px] font-semibold leading-tight">
                    Start from scratch
                  </p>
                  <p className="text-[11px] text-faint">
                    Build your own node structure
                  </p>
                </div>
              </div>
              <div
                className="mt-3 grid h-[104px] place-items-center rounded-lg border border-line2"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #232323 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              >
                <Plus size={16} className="text-dim" />
              </div>
            </div>
          </div>

          {/* ---- optional metadata ---- */}
          <button
            onClick={() => setOptionsOpen((v) => !v)}
            aria-expanded={optionsOpen}
            className="mt-6 flex items-center gap-1.5 text-[12.5px] text-dim transition-colors hover:text-ink"
          >
            <ChevronDown
              size={13}
              className={cx("transition-transform", optionsOpen && "rotate-180")}
            />
            Optional details
          </button>

          {optionsOpen && (
            <div className="mt-3 grid gap-3 rounded-xl border border-line2 bg-raise p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this flow for?"
                />
              </div>
              <div>
                <Label>Scope</Label>
                <Select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as FlowScope)}
                >
                  {(
                    [
                      "Entire Story",
                      "Character",
                      "Chapter",
                      "Scene",
                      "Worldbuilding",
                    ] as FlowScope[]
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Direction</Label>
                <Select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as FlowDirection)
                  }
                >
                  {(
                    [
                      "Linear",
                      "Branching",
                      "Cyclical",
                      "Parallel",
                      "Multi-POV",
                    ] as FlowDirection[]
                  ).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Narrative goal</Label>
                <Input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Keep the middle from sagging."
                />
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="mt-7 w-full text-[16px] font-semibold"
            onClick={create}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- glyphs ---------------- */

function TemplatesGlyph({ active }: { active: boolean }) {
  const dots = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => [c, r]));
  return (
    <svg viewBox="0 0 18 18" className="mt-0.5 h-[19px] w-[19px]" aria-hidden>
      {dots.map(([c, r], i) => (
        <circle
          key={i}
          cx={3 + c * 6}
          cy={3 + r * 6}
          r="2.3"
          fill={active ? "var(--ink-accent)" : "#4a4a4a"}
          opacity={i % 2 === 0 ? 1 : 0.65}
        />
      ))}
    </svg>
  );
}

function ScratchGlyph({ active }: { active: boolean }) {
  const c = active ? "var(--ink-accent)" : "#4a4a4a";
  return (
    <svg viewBox="0 0 18 18" className="mt-0.5 h-[19px] w-[19px]" aria-hidden>
      <g stroke={c} strokeWidth="1.2">
        <path d="M9 9 L3 3 M9 9 L15 3 M9 9 L3 15 M9 9 L15 15 M9 9 L9 2 M9 9 L9 16" />
      </g>
      {[
        [9, 9],
        [3, 3],
        [15, 3],
        [3, 15],
        [15, 15],
        [9, 2],
        [9, 16],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 2.4 : 1.7} fill={c} />
      ))}
    </svg>
  );
}

function TemplateGlyph({ id }: { id: FlowTemplateId }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.3 };
  if (id === "story") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink" aria-hidden>
        <path d="M3 18 L9 12 L13 15 L21 6" {...s} strokeLinecap="round" />
        <path d="M16 6 h5 v5" {...s} strokeLinecap="round" />
        <circle cx="9" cy="12" r="1.6" fill="currentColor" />
        <circle cx="13" cy="15" r="1.6" fill="currentColor" />
      </svg>
    );
  }
  if (id === "relationship") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink" aria-hidden>
        <path d="M12 6 V11 M6 17 V13 h12 v4" {...s} />
        <circle cx="12" cy="4" r="2.2" {...s} />
        <circle cx="6" cy="19" r="2.2" {...s} />
        <circle cx="18" cy="19" r="2.2" {...s} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink" aria-hidden>
      <path d="M3 12 h18 M12 3 v18" {...s} strokeLinecap="round" />
      <rect x="9" y="9" width="6" height="6" rx="1" {...s} />
    </svg>
  );
}
