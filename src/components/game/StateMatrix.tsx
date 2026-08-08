"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Chip, cx, Input, Label, Select } from "@/components/ui/primitives";
import { conditionVars, describeCondition, describeEffect, nextId } from "@/lib/game/logic";
import type { VarType, Variable } from "@/lib/game/types";

/**
 * State Matrix — the variables, and where each one is read and written.
 *
 * The usage columns are what make a large narrative tractable: you can see at
 * a glance whether a variable is actually load-bearing.
 */
export function StateMatrix() {
  const narrative = useStore((s) => s.narrative);
  const update = useStore((s) => s.updateNarrative);
  const [adding, setAdding] = useState(false);

  /** Where every variable is read (conditions) and written (effects). */
  const usage = useMemo(() => {
    const read = new Map<string, string[]>();
    const write = new Map<string, string[]>();
    const push = (m: Map<string, string[]>, k: string, v: string) =>
      m.set(k, [...(m.get(k) ?? []), v]);

    for (const d of narrative.dialogues) {
      for (const n of d.nodes) {
        n.conditions.forEach((c) =>
          conditionVars(c).forEach((v) => push(read, v, n.id)),
        );
        n.effects.forEach((e) => push(write, e.target, n.id));
        n.choices.forEach((ch) => {
          ch.conditions.forEach((c) =>
            conditionVars(c).forEach((v) => push(read, v, n.id)),
          );
          ch.effects.forEach((e) => push(write, e.target, n.id));
        });
      }
    }
    for (const q of narrative.quests) {
      q.prerequisites.forEach((c) =>
        conditionVars(c).forEach((v) => push(read, v, q.id)),
      );
      q.rewards.forEach((e) => push(write, e.target, q.id));
      q.objectives.forEach((o) =>
        o.completeWhen.forEach((c) =>
          conditionVars(c).forEach((v) => push(read, v, q.id)),
        ),
      );
    }
    for (const ev of narrative.events) {
      ev.conditions.forEach((c) =>
        conditionVars(c).forEach((v) => push(read, v, ev.id)),
      );
      ev.effects.forEach((e) => push(write, e.target, ev.id));
    }
    return { read, write };
  }, [narrative]);

  const addVariable = (v: Omit<Variable, "id">) => {
    const id = nextId("VAR", narrative.variables.map((x) => x.id));
    update({ variables: [...narrative.variables, { ...v, id }] });
    setAdding(false);
  };

  const removeVariable = (id: string) =>
    update({ variables: narrative.variables.filter((v) => v.id !== id) });

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold sm:text-[30px]">
            State Matrix
          </h1>
          <p className="mt-1 text-[14px] text-dim">
            Every variable, and everywhere it is read or written.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={15} /> Variable
        </Button>
      </div>

      {adding && <NewVariable onAdd={addVariable} onCancel={() => setAdding(false)} />}

      <div className="overflow-x-auto rounded-[14px] border-2 border-line">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b-2 border-line text-[12px] uppercase tracking-wider text-faint">
              <th className="px-3 py-2 font-normal">Id</th>
              <th className="px-3 py-2 font-normal">Name</th>
              <th className="px-3 py-2 font-normal">Type</th>
              <th className="px-3 py-2 font-normal">Initial</th>
              <th className="px-3 py-2 font-normal">Read by</th>
              <th className="px-3 py-2 font-normal">Written by</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {narrative.variables.map((v) => {
              const reads = usage.read.get(v.name) ?? [];
              const writes = usage.write.get(v.name) ?? [];
              return (
                <tr
                  key={v.id}
                  className="border-b border-line last:border-0 hover:bg-raise/50"
                >
                  <td className="px-3 py-2 font-mono text-[12px] text-faint">
                    {v.id}
                  </td>
                  <td className="px-3 py-2 font-mono text-[13px] text-ink">
                    {v.name}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-dim">{v.type}</td>
                  <td className="px-3 py-2 font-mono text-[12.5px] text-accent-soft">
                    {String(v.initial)}
                  </td>
                  <td className="px-3 py-2">
                    <Usage ids={reads} tone="read" />
                  </td>
                  <td className="px-3 py-2">
                    <Usage ids={writes} tone="write" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      aria-label={`Delete ${v.name}`}
                      onClick={() => removeVariable(v.id)}
                      className="text-faint transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {narrative.variables.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[13px] text-faint">
                  No variables yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------- world events ------------------------- */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-[17px] font-medium">
        <Zap size={16} className="text-accent" /> World events
      </h2>
      <div className="space-y-2">
        {narrative.events.map((ev) => (
          <div
            key={ev.id}
            className="rounded-[12px] border-2 border-line bg-raise/50 p-3.5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[15px] font-medium">{ev.name}</p>
              <code className="font-mono text-[11.5px] text-faint">{ev.id}</code>
            </div>
            <p className="mt-1 text-[13px] text-dim">{ev.description}</p>
            <div className="mt-2 space-y-1">
              {ev.conditions.map((c) => (
                <code key={c.id} className="block font-mono text-[11.5px] text-dim">
                  WHEN {describeCondition(c)}
                </code>
              ))}
              {ev.effects.map((e) => (
                <code
                  key={e.id}
                  className="block font-mono text-[11.5px] text-amber-200/80"
                >
                  THEN {describeEffect(e)}
                </code>
              ))}
            </div>
          </div>
        ))}
        {narrative.events.length === 0 && (
          <p className="rounded-[12px] border-2 border-line bg-raise/50 px-4 py-6 text-center text-[13px] text-faint">
            No world events yet.
          </p>
        )}
      </div>

      {/* --------------------------- factions --------------------------- */}
      <h2 className="mb-3 mt-8 text-[17px] font-medium">Factions</h2>
      <div className="flex flex-wrap gap-2">
        {narrative.factions.map((f) => (
          <div
            key={f.id}
            className="rounded-[12px] border-2 border-line bg-raise/50 px-3.5 py-2.5"
          >
            <p className="text-[14px]">{f.name}</p>
            <p className="text-[12px] text-faint">
              starts at {f.initialReputation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Usage({ ids, tone }: { ids: string[]; tone: "read" | "write" }) {
  if (ids.length === 0) {
    return <span className="text-[11.5px] text-faint">—</span>;
  }
  const unique = [...new Set(ids)];
  return (
    <div className="flex flex-wrap gap-1">
      {unique.slice(0, 3).map((id) => (
        <span
          key={id}
          className={cx(
            "rounded px-1.5 py-0.5 font-mono text-[10.5px]",
            tone === "read"
              ? "bg-accent/10 text-accent-soft"
              : "bg-amber-500/10 text-amber-200/80",
          )}
        >
          {id}
        </span>
      ))}
      {unique.length > 3 && (
        <span className="text-[10.5px] text-faint">+{unique.length - 3}</span>
      )}
    </div>
  );
}

function NewVariable({
  onAdd,
  onCancel,
}: {
  onAdd: (v: Omit<Variable, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<VarType>("boolean");
  const [initial, setInitial] = useState("false");
  const [description, setDescription] = useState("");

  const parse = () => {
    if (type === "boolean") return initial === "true";
    if (type === "integer" || type === "float" || type === "counter") {
      return Number(initial) || 0;
    }
    return initial;
  };

  return (
    <div className="mb-4 rounded-[14px] border-2 border-accent/40 bg-raise p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Name</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="player.has_key"
            className="h-10 text-[14px] sm:text-[14px]"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={type}
            onChange={(e) => {
              const t = e.target.value as VarType;
              setType(t);
              setInitial(t === "boolean" ? "false" : t === "string" || t === "enum" ? "" : "0");
            }}
            className="h-10 text-[14px] sm:text-[14px]"
          >
            {(["boolean", "integer", "float", "string", "enum", "counter"] as VarType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </Select>
        </div>
        <div>
          <Label>Initial</Label>
          {type === "boolean" ? (
            <Select
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="h-10 text-[14px] sm:text-[14px]"
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </Select>
          ) : (
            <Input
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="h-10 text-[14px] sm:text-[14px]"
            />
          )}
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-10 text-[14px] sm:text-[14px]"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={!name.trim()}
          onClick={() =>
            onAdd({ name: name.trim(), type, initial: parse(), description })
          }
        >
          Add variable
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <p className="mt-2 text-[11.5px] text-faint">
        <Chip tone="ghost">tip</Chip> dotted names group naturally —{" "}
        <code className="font-mono">player.gold</code>,{" "}
        <code className="font-mono">village.reputation</code>.
      </p>
    </div>
  );
}
