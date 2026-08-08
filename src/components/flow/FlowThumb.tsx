"use client";

import type { StoredFlowEdge, StoredFlowNode } from "@/lib/types";

/** A cheap static preview of a graph — no React Flow instance per card. */
export function FlowThumb({
  nodes,
  edges,
}: {
  nodes: StoredFlowNode[];
  edges: StoredFlowEdge[];
}) {
  if (nodes.length === 0) {
    return (
      <div
        className="aspect-[16/9] bg-void"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1e1e1e 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
    );
  }

  const pad = 60;
  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(Math.max(...xs) - minX + 180 + pad, 320);
  const h = Math.max(Math.max(...ys) - minY + 80 + pad, 180);
  const at = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? { x: n.position.x - minX + 75, y: n.position.y - minY + 20 } : null;
  };

  return (
    <div
      className="aspect-[16/9] bg-void"
      style={{
        backgroundImage: "radial-gradient(circle, #1a1a1a 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden>
        {edges.map((e) => {
          const a = at(e.source);
          const b = at(e.target);
          if (!a || !b) return null;
          return (
            <path
              key={e.id}
              d={`M${a.x + 75} ${a.y} C${a.x + 130} ${a.y}, ${b.x - 130} ${b.y}, ${b.x - 75} ${b.y}`}
              fill="none"
              stroke="#3a3a3a"
              strokeWidth="2"
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <rect
              x={n.position.x - minX}
              y={n.position.y - minY}
              width="150"
              height="40"
              rx="8"
              fill="#101010"
              stroke={n.data.accent ?? "#262626"}
              strokeWidth="1.5"
            />
            <text
              x={n.position.x - minX + 12}
              y={n.position.y - minY + 24}
              fill="#c8c8c8"
              fontSize="13"
              fontFamily="var(--font-sans-stack)"
            >
              {n.data.label.length > 17
                ? `${n.data.label.slice(0, 16)}…`
                : n.data.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
