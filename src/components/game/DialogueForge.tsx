"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, CornerDownRight, Lock, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Button,
  cx,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { describeCondition, describeEffect, nextId } from "@/lib/game/logic";
import type { Dialogue, DialogueNode, Emotion } from "@/lib/game/types";

const EMOTIONS: Emotion[] = [
  "neutral",
  "happy",
  "angry",
  "sad",
  "afraid",
  "surprised",
  "determined",
];

/**
 * Dialogue Forge — the node list for a conversation, with the branching
 * visible inline. Each node shows its conditions, effects and where every
 * choice leads, so "why did this line appear?" is answerable by reading.
 */
export function DialogueForge() {
  const narrative = useStore((s) => s.narrative);
  const entities = useStore((s) => s.entities);
  const update = useStore((s) => s.updateNarrative);

  const [convId, setConvId] = useState(narrative.dialogues[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);

  const conv = narrative.dialogues.find((d) => d.id === convId) ?? null;
  const nameOf = (id: string | null) =>
    id ? (entities.find((e) => e.id === id)?.name ?? id) : "Narration";

  const allNodeIds = useMemo(
    () => narrative.dialogues.flatMap((d) => d.nodes.map((n) => n.id)),
    [narrative],
  );

  const patchConv = (p: Partial<Dialogue>) => {
    if (!conv) return;
    update({
      dialogues: narrative.dialogues.map((d) =>
        d.id === conv.id ? { ...d, ...p } : d,
      ),
    });
  };

  const patchNode = (nodeId: string, p: Partial<DialogueNode>) => {
    if (!conv) return;
    patchConv({
      nodes: conv.nodes.map((n) => (n.id === nodeId ? { ...n, ...p } : n)),
    });
  };

  const addNode = () => {
    if (!conv) return;
    const id = nextId("DLG", allNodeIds);
    patchConv({
      nodes: [
        ...conv.nodes,
        {
          id,
          speakerId: null,
          text: "New line",
          emotion: "neutral",
          conditions: [],
          effects: [],
          choices: [],
          next: "",
        },
      ],
    });
    setSelected(id);
  };

  const addChoice = (node: DialogueNode) => {
    const id = nextId(
      "CHOICE",
      narrative.dialogues.flatMap((d) =>
        d.nodes.flatMap((n) => n.choices.map((c) => c.id)),
      ),
    );
    patchNode(node.id, {
      choices: [
        ...node.choices,
        { id, text: "New choice", conditions: [], effects: [], next: "" },
      ],
    });
  };

  if (!conv) {
    return (
      <p className="py-10 text-center text-[14px] text-faint">
        No conversations yet.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[24px] font-extrabold sm:text-[30px]">
            Dialogue Forge
          </h1>
          <p className="mt-1 text-[14px] text-dim">
            {conv.nodes.length} nodes · entry {conv.entryNodeId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={convId}
            onChange={(e) => setConvId(e.target.value)}
            className="h-10 w-[220px] text-[14px] sm:text-[14px]"
          >
            {narrative.dialogues.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Button onClick={addNode}>
            <Plus size={15} /> Node
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {conv.nodes.map((n) => {
          const isEntry = n.id === conv.entryNodeId;
          const expanded = selected === n.id;
          return (
            <div
              key={n.id}
              className={cx(
                "overflow-hidden rounded-[14px] border-2 bg-raise/50 transition-colors",
                expanded ? "border-accent/50" : "border-line",
              )}
            >
              <button
                onClick={() => setSelected(expanded ? null : n.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-raise"
              >
                <span className="mt-0.5 shrink-0">
                  {n.isEnding ? (
                    <Flag size={14} className="text-accent" />
                  ) : (
                    <CornerDownRight size={14} className="text-faint" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 flex flex-wrap items-center gap-2">
                    <code className="font-mono text-[11.5px] text-faint">
                      {n.id}
                    </code>
                    <span className="text-[13px] text-accent-soft">
                      {nameOf(n.speakerId)}
                    </span>
                    {isEntry && (
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10.5px] text-accent">
                        entry
                      </span>
                    )}
                    {n.isEnding && (
                      <span className="rounded bg-line px-1.5 py-0.5 text-[10.5px] text-dim">
                        {n.endingLabel ?? "ending"}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[14px] text-ink/90">
                    {n.text}
                  </span>
                  {n.choices.length > 0 && (
                    <span className="mt-1 block text-[11.5px] text-faint">
                      {n.choices.length} choices →{" "}
                      {n.choices.map((c) => c.next || "end").join(", ")}
                    </span>
                  )}
                </span>
              </button>

              {expanded && (
                <div className="space-y-4 border-t-2 border-line px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <div>
                      <Label>Speaker</Label>
                      <Select
                        value={n.speakerId ?? ""}
                        onChange={(e) =>
                          patchNode(n.id, { speakerId: e.target.value || null })
                        }
                        className="h-10 text-[14px] sm:text-[14px]"
                      >
                        <option value="">Narration</option>
                        {entities
                          .filter((e) => e.kind === "character")
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Emotion</Label>
                      <Select
                        value={n.emotion}
                        onChange={(e) =>
                          patchNode(n.id, { emotion: e.target.value as Emotion })
                        }
                        className="h-10 text-[14px] sm:text-[14px]"
                      >
                        {EMOTIONS.map((e) => (
                          <option key={e}>{e}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Line</Label>
                    <Textarea
                      rows={2}
                      value={n.text}
                      onChange={(e) => patchNode(n.id, { text: e.target.value })}
                      className="text-[14px] sm:text-[14px]"
                    />
                  </div>

                  {(n.conditions.length > 0 || n.effects.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {n.conditions.length > 0 && (
                        <div>
                          <Label>Shown when</Label>
                          {n.conditions.map((c) => (
                            <code
                              key={c.id}
                              className="block font-mono text-[11.5px] text-dim"
                            >
                              {describeCondition(c)}
                            </code>
                          ))}
                        </div>
                      )}
                      {n.effects.length > 0 && (
                        <div>
                          <Label>On entering</Label>
                          {n.effects.map((e) => (
                            <code
                              key={e.id}
                              className="block font-mono text-[11.5px] text-amber-200/80"
                            >
                              {describeEffect(e)}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* choices */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>Choices</Label>
                      <button
                        onClick={() => addChoice(n)}
                        className="text-[12.5px] text-accent hover:text-accent-soft"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {n.choices.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-line2 bg-black p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            {c.conditions.length > 0 && (
                              <Lock size={12} className="shrink-0 text-amber-400/70" />
                            )}
                            <input
                              value={c.text}
                              onChange={(e) =>
                                patchNode(n.id, {
                                  choices: n.choices.map((x) =>
                                    x.id === c.id
                                      ? { ...x, text: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
                            />
                            <Select
                              value={c.next}
                              onChange={(e) =>
                                patchNode(n.id, {
                                  choices: n.choices.map((x) =>
                                    x.id === c.id
                                      ? { ...x, next: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                              className="h-8 w-[130px] shrink-0 text-[12px] sm:text-[12px]"
                            >
                              <option value="">→ end</option>
                              {allNodeIds.map((id) => (
                                <option key={id} value={id}>
                                  → {id}
                                </option>
                              ))}
                            </Select>
                            <button
                              aria-label="Remove choice"
                              onClick={() =>
                                patchNode(n.id, {
                                  choices: n.choices.filter(
                                    (x) => x.id !== c.id,
                                  ),
                                })
                              }
                              className="shrink-0 text-faint transition-colors hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {(c.conditions.length > 0 || c.effects.length > 0) && (
                            <div className="mt-1.5 space-y-0.5 pl-1">
                              {c.conditions.map((cond) => (
                                <code
                                  key={cond.id}
                                  className="block font-mono text-[11px] text-dim"
                                >
                                  requires {describeCondition(cond)}
                                </code>
                              ))}
                              {c.effects.map((e) => (
                                <code
                                  key={e.id}
                                  className="block font-mono text-[11px] text-amber-200/80"
                                >
                                  {describeEffect(e)}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {n.choices.length === 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[12.5px] text-faint">
                            No choices — continues to
                          </span>
                          <Select
                            value={n.next}
                            onChange={(e) =>
                              patchNode(n.id, { next: e.target.value })
                            }
                            className="h-8 w-[150px] text-[12px] sm:text-[12px]"
                          >
                            <option value="">nothing (ending)</option>
                            {allNodeIds.map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
                    <label className="flex items-center gap-2 text-[13px] text-dim">
                      <input
                        type="checkbox"
                        checked={!!n.isEnding}
                        onChange={(e) =>
                          patchNode(n.id, { isEnding: e.target.checked })
                        }
                      />
                      Ending
                    </label>
                    {n.isEnding && (
                      <Input
                        value={n.endingLabel ?? ""}
                        onChange={(e) =>
                          patchNode(n.id, { endingLabel: e.target.value })
                        }
                        placeholder="Ending A — …"
                        className="h-8 max-w-[240px] text-[13px] sm:text-[13px]"
                      />
                    )}
                    <button
                      onClick={() => patchConv({ entryNodeId: n.id })}
                      disabled={isEntry}
                      className="text-[12.5px] text-accent disabled:text-faint"
                    >
                      {isEntry ? "Entry node" : "Make entry node"}
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete ${n.id}?`)) return;
                        patchConv({
                          nodes: conv.nodes.filter((x) => x.id !== n.id),
                        });
                        setSelected(null);
                      }}
                      className="ml-auto text-[12.5px] text-red-300 hover:text-red-200"
                    >
                      Delete node
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
