"use client";

import { useMemo, useState } from "react";
import {
  Play,
  RotateCcw,
  Bug,
  ChevronRight,
  Flag,
  Zap,
  MessageSquare,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, cx } from "@/components/ui/primitives";
import {
  choose,
  currentFrame,
  startSession,
  setVar,
} from "@/lib/game/runtime";
import { describeCondition, describeEffect, evalCondition } from "@/lib/game/logic";
import type { PlaytestSession, VarValue } from "@/lib/game/types";

/**
 * Narrative Simulator — build the narrative, press PLAY, experience it.
 *
 * The session lives in component state, never in the project store, so a
 * playthrough cannot write back into the creator's source narrative.
 */
export function Simulator() {
  const narrative = useStore((s) => s.narrative);
  const entities = useStore((s) => s.entities);

  const [session, setSession] = useState<PlaytestSession | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);
  const [startAt, setStartAt] = useState<string>("");

  const frame = useMemo(
    () => (session ? currentFrame(narrative, session) : null),
    [narrative, session],
  );

  const nameOf = (id: string | null) =>
    id ? (entities.find((e) => e.id === id)?.name ?? id) : "";

  const allNodes = useMemo(
    () => narrative.dialogues.flatMap((d) => d.nodes.map((n) => ({ d, n }))),
    [narrative],
  );

  const begin = (nodeId?: string) => {
    setSession(
      startSession(narrative, nodeId ? { nodeId } : {}),
    );
  };

  if (!session || !frame) {
    return (
      <div className="mx-auto max-w-[720px] py-10 text-center">
        <div className="mb-5 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-line bg-raise text-accent">
            <Play size={26} />
          </span>
        </div>
        <h2 className="font-display text-[24px] font-extrabold sm:text-[30px]">
          Play the narrative
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[15px] leading-relaxed text-dim">
          Runs the flow you designed — conditions, effects, quests and world
          events all execute. The session is throwaway; nothing you do here
          touches the project.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button size="lg" onClick={() => begin()}>
            <Play size={16} /> Play from start
          </Button>
        </div>

        <div className="mx-auto mt-6 max-w-[440px] text-left">
          <label className="mb-1.5 block text-[14px] text-faint">
            Or start from a specific node
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="ig-field h-10 w-full min-w-0 flex-1 rounded-[10px] border-2 border-line2 bg-black px-3 text-[14px] text-ink outline-none"
            >
              <option value="">Choose a node…</option>
              {allNodes.map(({ d, n }) => (
                <option key={n.id} value={n.id}>
                  {n.id} — {n.text.slice(0, 48)}
                  {n.text.length > 48 ? "…" : ""} ({d.name})
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              disabled={!startAt}
              onClick={() => begin(startAt)}
            >
              Play here
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const node = frame.node;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      {/* ------------------------- stage ------------------------- */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => begin()}>
            <RotateCcw size={13} /> Restart
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDebugOpen((v) => !v)}
          >
            <Bug size={13} /> {debugOpen ? "Hide" : "Show"} state
          </Button>
          <span className="ml-auto text-[13px] text-faint">
            {session.visitedNodes.length} nodes visited
          </span>
        </div>

        <div className="min-h-[280px] rounded-[18px] border-2 border-line bg-raise p-5 sm:p-7">
          {frame.finished ? (
            <div className="py-10 text-center">
              <Flag size={26} className="mx-auto mb-3 text-accent" />
              <p className="font-display text-[20px] font-extrabold sm:text-[24px]">
                {session.endingLabel ?? "End"}
              </p>
              <p className="mt-2 text-[14px] text-dim">
                {session.takenChoices.length} choices ·{" "}
                {session.visitedNodes.length} nodes
              </p>
              <Button className="mt-5" onClick={() => begin()}>
                <RotateCcw size={14} /> Play again
              </Button>
            </div>
          ) : node ? (
            <>
              {node.speakerId ? (
                <p className="mb-2 font-display text-[16px] font-extrabold uppercase tracking-wide text-accent sm:text-[18px]">
                  {nameOf(node.speakerId)}
                  <span className="ml-2 font-sans text-[12px] font-normal normal-case tracking-normal text-faint">
                    {node.emotion}
                  </span>
                </p>
              ) : (
                <p className="mb-2 text-[13px] uppercase tracking-wider text-faint">
                  Narration
                </p>
              )}

              <p className="text-[17px] leading-relaxed text-ink sm:text-[19px]">
                {node.text}
              </p>

              {(node.camera || node.animation || node.sfx) && (
                <p className="mt-3 text-[12px] text-faint">
                  {[node.camera, node.animation, node.sfx]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="mt-6 space-y-2">
                {frame.choices.map(({ choice, enabled, reason }) => (
                  <button
                    key={choice.id}
                    disabled={!enabled}
                    onClick={() =>
                      setSession(choose(narrative, session, choice.id))
                    }
                    className={cx(
                      "group flex w-full items-center gap-3 rounded-[10px] border-2 px-4 py-3 text-left transition-all",
                      enabled
                        ? "border-line2 hover:border-accent hover:bg-accent/5"
                        : "cursor-not-allowed border-line bg-black/40 opacity-55",
                    )}
                  >
                    <ChevronRight
                      size={15}
                      className={cx(
                        "shrink-0",
                        enabled
                          ? "text-faint group-hover:text-accent"
                          : "text-faint",
                      )}
                    />
                    <span className="min-w-0 flex-1 text-[15px] sm:text-[16px]">
                      {choice.text}
                      {!enabled && reason && (
                        <span className="mt-0.5 block text-[12px] text-faint">
                          🔒 {reason}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
                {frame.choices.length === 0 && (
                  <p className="text-[13px] text-faint">
                    No choices available here.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* ---------------------- branch history ---------------------- */}
        <h3 className="mb-2 mt-6 text-[15px] font-medium">Branch history</h3>
        <ol className="space-y-1">
          {session.history.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-md px-2 py-1 text-[13px]"
            >
              {h.kind === "node" && (
                <>
                  <MessageSquare size={13} className="mt-0.5 shrink-0 text-faint" />
                  <span className="text-dim">
                    <span className="text-ink">{nameOf(h.speaker) || "—"}</span>{" "}
                    {h.text.slice(0, 80)}
                    {h.text.length > 80 ? "…" : ""}
                  </span>
                </>
              )}
              {h.kind === "choice" && (
                <>
                  <ChevronRight size={13} className="mt-0.5 shrink-0 text-accent" />
                  <span className="text-accent-soft">“{h.text}”</span>
                </>
              )}
              {h.kind === "effect" && (
                <>
                  <Zap size={13} className="mt-0.5 shrink-0 text-amber-400/80" />
                  <code className="font-mono text-[12px] text-amber-200/80">
                    {h.describe}
                  </code>
                </>
              )}
              {h.kind === "quest" && (
                <>
                  <Flag size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  <span className="text-emerald-200/80">
                    {h.questId} → {h.state}
                  </span>
                </>
              )}
              {h.kind === "event" && (
                <>
                  <Zap size={13} className="mt-0.5 shrink-0 text-fuchsia-400/80" />
                  <span className="text-fuchsia-200/80">event: {h.name}</span>
                </>
              )}
              {h.kind === "end" && (
                <>
                  <Flag size={13} className="mt-0.5 shrink-0 text-accent" />
                  <span className="text-ink">{h.label}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* ------------------------ debug panel ------------------------ */}
      {debugOpen && (
        <aside className="min-w-0 space-y-4">
          <Panel title="Current">
            <Row k="Node" v={session.currentNodeId ?? "—"} />
            <Row
              k="Conversation"
              v={
                narrative.dialogues.find(
                  (d) => d.id === session.currentDialogueId,
                )?.name ?? "—"
              }
            />
            <Row k="Location" v={nameOf(node?.locationId ?? null) || "—"} />
          </Panel>

          {node && node.choices.length > 0 && (
            <Panel title="Conditions on this node's choices">
              {node.choices.map((c) =>
                c.conditions.length === 0 ? null : (
                  <div key={c.id} className="mb-2 last:mb-0">
                    <p className="mb-0.5 truncate text-[12px] text-dim">
                      “{c.text}”
                    </p>
                    {c.conditions.map((cond) => {
                      const pass = evalCondition(cond, session.vars);
                      return (
                        <p
                          key={cond.id}
                          className="flex items-start gap-1.5 font-mono text-[11.5px]"
                        >
                          <span className={pass ? "text-emerald-400" : "text-red-400"}>
                            {pass ? "✓" : "✕"}
                          </span>
                          <span className="text-dim">
                            {describeCondition(cond)}
                          </span>
                        </p>
                      );
                    })}
                  </div>
                ),
              )}
              {node.choices.every((c) => c.conditions.length === 0) && (
                <p className="text-[12px] text-faint">
                  None of these choices are gated.
                </p>
              )}
            </Panel>
          )}

          {node && node.effects.length > 0 && (
            <Panel title="Effects applied here">
              {node.effects.map((e) => (
                <code
                  key={e.id}
                  className="block font-mono text-[11.5px] text-amber-200/80"
                >
                  {describeEffect(e)}
                </code>
              ))}
            </Panel>
          )}

          <Panel title="Variables">
            <div className="space-y-1">
              {Object.entries(session.vars).map(([name, value]) => (
                <div key={name} className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-dim">
                    {name}
                  </code>
                  <VarEditor
                    value={value}
                    onChange={(v) => setSession(setVar(session, name, v))}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quests">
            {Object.entries(session.questStates).map(([qid, st]) => {
              const q = narrative.quests.find((x) => x.id === qid);
              return (
                <div key={qid} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-dim">
                    {q?.name ?? qid}
                  </span>
                  <span
                    className={cx(
                      "shrink-0 text-[11.5px]",
                      st === "completed" && "text-emerald-400",
                      st === "failed" && "text-red-400",
                      st === "active" && "text-accent",
                      (st === "available" || st === "unavailable") && "text-faint",
                    )}
                  >
                    {st}
                  </span>
                </div>
              );
            })}
          </Panel>

          {session.firedEvents.length > 0 && (
            <Panel title="Events fired">
              {session.firedEvents.map((id) => (
                <p key={id} className="text-[12.5px] text-fuchsia-200/80">
                  {narrative.events.find((e) => e.id === id)?.name ?? id}
                </p>
              ))}
            </Panel>
          )}
        </aside>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border-2 border-line bg-raise p-3.5">
      <h3 className="mb-2 text-[12px] uppercase tracking-wider text-faint">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
      <span className="text-faint">{k}</span>
      <span className="truncate text-ink">{v}</span>
    </div>
  );
}

/** Live variable override — the spec asks for changing state mid-playtest. */
function VarEditor({
  value,
  onChange,
}: {
  value: VarValue;
  onChange: (v: VarValue) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <button
        onClick={() => onChange(!value)}
        className={cx(
          "shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px]",
          value ? "bg-emerald-500/20 text-emerald-300" : "bg-line text-faint",
        )}
      >
        {String(value)}
      </button>
    );
  }
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 shrink-0 rounded border border-line2 bg-black px-1.5 py-0.5 text-right font-mono text-[11px] text-ink outline-none focus:border-accent/60"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 shrink-0 rounded border border-line2 bg-black px-1.5 py-0.5 font-mono text-[11px] text-ink outline-none focus:border-accent/60"
    />
  );
}
