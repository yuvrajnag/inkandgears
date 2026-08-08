"use client";

import Link from "next/link";
import { useState } from "react";
import type { ScenePoint } from "@/lib/pulse";

const W = 1000;
const H = 190;
const PAD_X = 14;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

/** Emotional/tension arc across the reading order. Hover for the scene behind a point. */
export function TensionChart({
  points,
  onPick,
}: {
  points: ScenePoint[];
  onPick: (id: string) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="grid h-[190px] place-items-center rounded-xl border border-line bg-raise/50 text-[12px] text-faint">
        Write a scene and the arc appears here.
      </div>
    );
  }

  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const step =
    points.length > 1 ? (W - PAD_X * 2) / (points.length - 1) : 0;
  const xy = points.map((p, i) => ({
    x: points.length > 1 ? PAD_X + i * step : W / 2,
    y: PAD_TOP + plotH - (p.tension / 100) * plotH,
    p,
  }));

  const line = xy
    .map((pt, i) => (i === 0 ? `M${pt.x} ${pt.y}` : `L${pt.x} ${pt.y}`))
    .join(" ");
  const area = `${line} L${xy[xy.length - 1].x} ${PAD_TOP + plotH} L${xy[0].x} ${PAD_TOP + plotH} Z`;

  const active = hover !== null ? xy[hover] : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-raise/50">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-[190px] w-full"
        role="img"
        aria-label={`Tension across ${points.length} scenes`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--ink-accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--ink-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + plotH * t}
            y2={PAD_TOP + plotH * t}
            stroke="#1c1c1c"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="url(#pulseFill)" />
        <path
          d={line}
          fill="none"
          stroke="var(--ink-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {xy.map((pt, i) => (
          <g key={pt.p.id}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hover === i ? 5 : 3.2}
              fill={hover === i ? "var(--ink-accent)" : "#0d0d0d"}
              stroke="var(--ink-accent)"
              strokeWidth="1.8"
            />
            <rect
              x={pt.x - step / 2}
              y={0}
              width={Math.max(step, 24)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onClick={() => onPick(pt.p.id)}
              className="cursor-pointer"
            />
          </g>
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD_TOP}
            y2={PAD_TOP + plotH}
            stroke="var(--ink-accent)"
            strokeOpacity=".3"
            strokeWidth="1"
          />
        )}
      </svg>

      <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[10.5px]">
        {active ? (
          <>
            <Link
              href="/script"
              onClick={() => onPick(active.p.id)}
              className="truncate text-ink transition-colors hover:text-accent"
            >
              {active.p.chapter} / {active.p.title}
            </Link>
            <span className="shrink-0 text-faint">
              tension {active.p.tension} · {active.p.words} words ·{" "}
              {active.p.cast} linked
            </span>
          </>
        ) : (
          <>
            <span className="text-faint">
              {points.length} scenes in reading order
            </span>
            <span className="text-faint">hover a point</span>
          </>
        )}
      </div>
    </div>
  );
}
