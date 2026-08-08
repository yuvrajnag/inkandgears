"use client";

import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/components/ui/primitives";
import { useHydrated } from "@/lib/useHydrated";
import { ENTITY_KINDS } from "@/lib/types";
import type { SlashItem } from "./slashCommand";

export type MenuState = {
  items: SlashItem[];
  rect: DOMRect | null;
  onSelect: (item: SlashItem) => void;
} | null;

const KIND_LABEL = new Map<string, string>(
  ENTITY_KINDS.map((k) => [k.kind as string, k.label]),
);

export function SlashMenu({
  state,
  index,
  setIndex,
}: {
  state: MenuState;
  index: number;
  setIndex: (i: number) => void;
}) {
  const mounted = useHydrated();
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [index, state]);

  if (!mounted || !state || !state.rect) return null;

  const { rect, items, onSelect } = state;

  // Flip above the caret when there isn't room below.
  const below = window.innerHeight - rect.bottom > 260;
  const top = below ? rect.bottom + 6 : undefined;
  const bottom = below ? undefined : window.innerHeight - rect.top + 6;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 292));

  return createPortal(
    <div
      role="listbox"
      aria-label="Insert story entity"
      style={{ top, bottom, left }}
      className="fixed z-50 w-[min(280px,calc(100vw-1rem))] overflow-hidden rounded-xl border border-line2 bg-panel shadow-2xl"
    >
      {items.length === 0 ? (
        <p className="px-3 py-3 text-[15.6px] text-faint">
          Nothing matches. Keep typing to name something new.
        </p>
      ) : (
        <div ref={listRef} className="max-h-[248px] overflow-y-auto p-1.5">
          {items.map((item, i) => (
            <button
              key={keyFor(item, i)}
              data-active={i === index}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className={cx(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                i === index ? "bg-raise2 text-ink" : "text-dim",
              )}
            >
              {item.type === "kind" ? (
                <>
                  <code className="w-8 shrink-0 font-mono text-[14.3px] text-accent">
                    /{item.slash}
                  </code>
                  <span className="truncate text-[16.2px]">{item.label}</span>
                </>
              ) : item.type === "create" ? (
                <>
                  <span className="w-8 shrink-0 text-center text-[16.9px] text-accent">
                    +
                  </span>
                  <span className="truncate text-[16.2px]">
                    New {KIND_LABEL.get(item.kind)?.toLowerCase()}{" "}
                    <span className="text-ink">“{item.name}”</span>
                  </span>
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: dot(item.kind) }}
                  />
                  <span className="ml-1.5 min-w-0 flex-1 truncate text-[16.2px]">
                    {item.label}
                  </span>
                  <span className="shrink-0 text-[13px] text-faint">
                    {KIND_LABEL.get(item.kind)}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
      <p className="border-t border-line px-3 py-1.5 text-[13px] text-faint">
        ↑↓ to move · ⏎ to insert · esc to dismiss
      </p>
    </div>,
    document.body,
  );
}

function keyFor(item: SlashItem, i: number) {
  if (item.type === "entity") return item.id;
  if (item.type === "kind") return `k${item.slash}`;
  return `c${i}`;
}

function dot(kind: string) {
  return (
    {
      character: "#7fd8ff",
      location: "#35d39a",
      faction: "#c479ea",
      item: "#e8a24d",
      event: "#e86b6b",
    }[kind] ?? "#8b8b8b"
  );
}
