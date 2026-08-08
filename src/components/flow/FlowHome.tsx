"use client";

import Link from "next/link";
import { Maximize2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "@/components/board/BoardBar";
import { EmptyState } from "@/components/ui/primitives";
import { FlowThumb } from "./FlowThumb";

export function FlowHome() {
  const hydrated = useHydrated();
  const flows = useStore((s) => s.flows);
  const removeFlow = useStore((s) => s.removeFlow);

  if (!hydrated) return <div className="h-full" />;

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[{ label: "All" }]}
        createHref="/flow/new"
        trailing={<Maximize2 size={11} className="text-faint" />}
      />

      {flows.length === 0 ? (
        <div className="flex-1">
          <EmptyState />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flows.map((f) => (
              <div key={f.id} className="group relative">
                <Link
                  href={`/flow/${f.id}`}
                  className="block overflow-hidden rounded-xl border border-line transition-all hover:border-accent/50"
                >
                  <FlowThumb nodes={f.nodes} edges={f.edges} />
                  <div className="border-t border-line px-3 py-2.5">
                    <p className="truncate text-[13px] font-medium">{f.name}</p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {f.scope} · {f.direction} · {f.nodes.length} node
                      {f.nodes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
                <button
                  aria-label={`Delete ${f.name}`}
                  onClick={() => {
                    if (confirm(`Delete the flow "${f.name}"?`)) removeFlow(f.id);
                  }}
                  className="absolute right-2 top-2 hidden rounded-md bg-black/70 p-1.5 text-dim backdrop-blur transition-colors hover:text-red-400 group-hover:block"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
