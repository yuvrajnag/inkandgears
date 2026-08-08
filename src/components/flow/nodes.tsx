"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/lib/types";
import { cx } from "@/components/ui/primitives";

type Props = NodeProps & { data: FlowNodeData };

/** One node style, tinted by kind. Double-click to rename in place. */
function BaseNode({ data, id, selected }: Props & { id: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed) {
      setValue(data.label);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("ig:rename-node", { detail: { id, label: trimmed } }),
    );
  };

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      className={cx(
        "ig-node min-w-[150px] max-w-[240px] rounded-[10px] border bg-raise px-3 py-2.5 transition-colors",
        selected ? "border-accent" : "border-line2 hover:border-dim/50",
      )}
      style={data.accent ? { borderColor: data.accent } : undefined}
    >
      <Handle type="target" position={Position.Left} />
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setValue(data.label);
              setEditing(false);
            }
          }}
          className="w-full bg-transparent text-[16.2px] font-medium outline-none"
        />
      ) : (
        <p className="text-[16.2px] font-medium leading-snug">{data.label}</p>
      )}
      {data.note && (
        <p className="mt-1 text-[13.7px] leading-snug text-faint">{data.note}</p>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const Beat = memo((p: Props) => <BaseNode {...p} id={p.id} />);
Beat.displayName = "BeatNode";

const Character = memo((p: Props) => (
  <BaseNode
    {...p}
    id={p.id}
    data={{ ...p.data, accent: p.data.accent ?? "#3d5a8a" }}
  />
));
Character.displayName = "CharacterNode";

const Event = memo((p: Props) => (
  <BaseNode
    {...p}
    id={p.id}
    data={{ ...p.data, accent: p.data.accent ?? "#5a4a2e" }}
  />
));
Event.displayName = "EventNode";

export const nodeTypes = {
  beat: Beat,
  character: Character,
  event: Event,
};
