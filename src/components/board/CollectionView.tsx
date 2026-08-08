"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SlidersHorizontal, ImageOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "./BoardBar";
import { cx, EmptyState, Button } from "@/components/ui/primitives";

export function CollectionView({ boardId }: { boardId: string }) {
  const hydrated = useHydrated();
  const board = useStore((s) => s.boards.find((b) => b.id === boardId));
  const entities = useStore((s) => s.entities);
  const [dense, setDense] = useState(false);

  const members = useMemo(
    () =>
      entities
        .filter((e) => e.boardId === boardId)
        .sort((a, b) => a.createdAt - b.createdAt),
    [entities, boardId],
  );

  if (!hydrated) return <div className="h-full" />;

  if (!board) {
    return (
      <div className="flex h-full flex-col">
        <BoardBar crumbs={[{ label: "All", href: "/board" }]} createHref="/board/new" />
        <div className="flex-1">
          <EmptyState caption="Collection Not Found">
            <Link href="/board">
              <Button variant="outline" size="sm">
                Back to Board
              </Button>
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[
          { label: "All", href: "/board" },
          { label: board.name.toLowerCase() },
        ]}
        createHref={`/board/new?board=${board.id}`}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-[27px] font-bold leading-none">
            {board.name}
          </h1>
          <button
            aria-label={dense ? "Comfortable grid" : "Dense grid"}
            aria-pressed={dense}
            onClick={() => setDense((v) => !v)}
            className={cx(
              "rounded-md p-1.5 transition-colors",
              dense ? "bg-raise2 text-ink" : "text-dim hover:text-ink",
            )}
          >
            <SlidersHorizontal size={17} strokeWidth={1.6} />
          </button>
        </div>

        {members.length === 0 ? (
          <EmptyState caption="Nothing In Here Yet">
            <Link href={`/board/new?board=${board.id}`}>
              <Button size="sm">Add the first one</Button>
            </Link>
          </EmptyState>
        ) : (
          <div
            className={cx(
              "grid gap-4",
              dense
                ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"
                : "grid-cols-2 sm:grid-cols-3",
            )}
          >
            {members.map((e) => {
              const cover = e.images[e.coverIndex] ?? e.images[0];
              return (
                <Link
                  key={e.id}
                  href={`/board/e/${e.id}`}
                  className="group block overflow-hidden rounded-xl border border-line transition-all hover:border-accent/50"
                >
                  <div className="relative aspect-[16/10] bg-raise">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover.src}
                        alt={e.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-faint">
                        <ImageOff size={18} strokeWidth={1.6} />
                      </div>
                    )}
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2 pt-8 text-[12px] font-medium">
                      {e.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
