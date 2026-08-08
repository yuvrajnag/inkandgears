"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, Flag } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, cx, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { describeCondition, describeEffect, nextId } from "@/lib/game/logic";
import type { Quest, QuestState } from "@/lib/game/types";

const STATES: QuestState[] = [
  "unavailable",
  "available",
  "active",
  "completed",
  "failed",
];

export function QuestForge() {
  const narrative = useStore((s) => s.narrative);
  const entities = useStore((s) => s.entities);
  const update = useStore((s) => s.updateNarrative);
  const [open, setOpen] = useState<string | null>(
    narrative.quests[0]?.id ?? null,
  );

  const nameOf = (id: string | null) =>
    id ? (entities.find((e) => e.id === id)?.name ?? id) : "—";

  const patch = (id: string, p: Partial<Quest>) =>
    update({
      quests: narrative.quests.map((q) => (q.id === id ? { ...q, ...p } : q)),
    });

  const addQuest = () => {
    const id = nextId("QUEST", narrative.quests.map((q) => q.id));
    update({
      quests: [
        ...narrative.quests,
        {
          id,
          name: "New quest",
          description: "",
          giverId: null,
          locationId: null,
          prerequisites: [],
          objectives: [],
          rewards: [],
          onFail: [],
          failWhen: [],
          unlocks: [],
          dialogueId: null,
          initialState: "available",
        },
      ],
    });
    setOpen(id);
  };

  const removeQuest = (id: string) =>
    update({ quests: narrative.quests.filter((q) => q.id !== id) });

  const addObjective = (q: Quest) => {
    const id = nextId(
      "OBJ",
      narrative.quests.flatMap((x) => x.objectives.map((o) => o.id)),
    );
    patch(q.id, {
      objectives: [
        ...q.objectives,
        {
          id,
          kind: "talk",
          description: "New objective",
          target: "",
          optional: false,
          hidden: false,
          completeWhen: [],
        },
      ],
    });
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold sm:text-[30px]">
            Quest Forge
          </h1>
          <p className="mt-1 text-[14px] text-dim">
            {narrative.quests.length} quests. Ids are stable — renaming never
            changes them.
          </p>
        </div>
        <Button onClick={addQuest}>
          <Plus size={15} /> Quest
        </Button>
      </div>

      <div className="space-y-2">
        {narrative.quests.map((q) => {
          const expanded = open === q.id;
          return (
            <div
              key={q.id}
              className="overflow-hidden rounded-[14px] border-2 border-line bg-raise/50"
            >
              <button
                onClick={() => setOpen(expanded ? null : q.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raise"
              >
                <Flag size={15} className="shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{q.name}</span>
                  <span className="block truncate text-[12px] text-faint">
                    {q.id} · {q.objectives.length} objectives · given by{" "}
                    {nameOf(q.giverId)}
                  </span>
                </span>
                <span
                  className={cx(
                    "shrink-0 rounded px-2 py-0.5 text-[11.5px]",
                    q.initialState === "available"
                      ? "bg-accent/15 text-accent"
                      : "bg-line text-faint",
                  )}
                >
                  {q.initialState}
                </span>
                <ChevronDown
                  size={15}
                  className={cx(
                    "shrink-0 text-faint transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {expanded && (
                <div className="space-y-4 border-t-2 border-line px-4 py-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={q.name}
                        onChange={(e) => patch(q.id, { name: e.target.value })}
                        className="h-10 text-[14px] sm:text-[14px]"
                      />
                    </div>
                    <div>
                      <Label>Initial state</Label>
                      <Select
                        value={q.initialState}
                        onChange={(e) =>
                          patch(q.id, {
                            initialState: e.target.value as QuestState,
                          })
                        }
                        className="h-10 text-[14px] sm:text-[14px]"
                      >
                        {STATES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={q.description}
                      onChange={(e) =>
                        patch(q.id, { description: e.target.value })
                      }
                      className="text-[14px] sm:text-[14px]"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Quest giver</Label>
                      <Select
                        value={q.giverId ?? ""}
                        onChange={(e) =>
                          patch(q.id, { giverId: e.target.value || null })
                        }
                        className="h-10 text-[14px] sm:text-[14px]"
                      >
                        <option value="">—</option>
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
                      <Label>Location</Label>
                      <Select
                        value={q.locationId ?? ""}
                        onChange={(e) =>
                          patch(q.id, { locationId: e.target.value || null })
                        }
                        className="h-10 text-[14px] sm:text-[14px]"
                      >
                        <option value="">—</option>
                        {entities
                          .filter((e) => e.kind === "location")
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                      </Select>
                    </div>
                  </div>

                  {/* objectives */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>Objectives</Label>
                      <button
                        onClick={() => addObjective(q)}
                        className="text-[12.5px] text-accent hover:text-accent-soft"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {q.objectives.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center gap-2 rounded-lg border border-line2 bg-black px-3 py-2"
                        >
                          <code className="shrink-0 font-mono text-[11px] text-faint">
                            {o.id}
                          </code>
                          <input
                            value={o.description}
                            onChange={(e) =>
                              patch(q.id, {
                                objectives: q.objectives.map((x) =>
                                  x.id === o.id
                                    ? { ...x, description: e.target.value }
                                    : x,
                                ),
                              })
                            }
                            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
                          />
                          <span className="shrink-0 rounded bg-line px-1.5 py-0.5 text-[11px] text-dim">
                            {o.kind}
                          </span>
                          {o.optional && (
                            <span className="shrink-0 text-[11px] text-faint">
                              optional
                            </span>
                          )}
                          <button
                            aria-label="Remove objective"
                            onClick={() =>
                              patch(q.id, {
                                objectives: q.objectives.filter(
                                  (x) => x.id !== o.id,
                                ),
                              })
                            }
                            className="shrink-0 text-faint transition-colors hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {q.objectives.length === 0 && (
                        <p className="rounded-lg border border-line2 bg-black px-3 py-2 text-[12.5px] text-faint">
                          No objectives — this quest can never complete.
                        </p>
                      )}
                    </div>
                  </div>

                  {(q.prerequisites.length > 0 || q.rewards.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {q.prerequisites.length > 0 && (
                        <div>
                          <Label>Available when</Label>
                          {q.prerequisites.map((c) => (
                            <code
                              key={c.id}
                              className="block font-mono text-[11.5px] text-dim"
                            >
                              {describeCondition(c)}
                            </code>
                          ))}
                        </div>
                      )}
                      {q.rewards.length > 0 && (
                        <div>
                          <Label>On completion</Label>
                          {q.rewards.map((e) => (
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

                  <div className="border-t border-line pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/40 text-red-300 hover:border-red-500 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm(`Delete ${q.name}?`)) removeQuest(q.id);
                      }}
                    >
                      <Trash2 size={13} /> Delete quest
                    </Button>
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
