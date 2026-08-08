"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pin, SlidersHorizontal, ImageOff } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "./BoardBar";
import { cx, EmptyState } from "@/components/ui/primitives";
import { ENTITY_KINDS, type EntityKind } from "@/lib/types";

type SortKey = "recent" | "name" | "kind";

export function BoardHome() {
  const hydrated = useHydrated();
  const boards = useStore((s) => s.boards);
  const entities = useStore((s) => s.entities);
  const togglePin = useStore((s) => s.togglePin);

  const [sort, setSort] = useState<SortKey>("recent");
  const [kindFilter, setKindFilter] = useState<EntityKind | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const withImages = useMemo(
    () => entities.filter((e) => e.images.length > 0),
    [entities],
  );

  const noArtwork = useMemo(
    () =>
      entities
        .filter((e) => e.images.length === 0)
        .filter((e) => kindFilter === "all" || e.kind === kindFilter)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [entities, kindFilter],
  );

  const shots = useMemo(() => {
    const list = withImages.filter(
      (e) => kindFilter === "all" || e.kind === kindFilter,
    );
    const sorted = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "kind") return a.kind.localeCompare(b.kind);
      return b.updatedAt - a.updatedAt;
    });
    return sorted.flatMap((e) =>
      e.images.map((img) => ({ img, entity: e })),
    );
  }, [withImages, sort, kindFilter]);

  const sortedBoards = useMemo(
    () =>
      [...boards].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || a.createdAt - b.createdAt,
      ),
    [boards],
  );

  if (!hydrated) return <BoardSkeleton />;

  const empty = boards.length === 0 && entities.length === 0;

  return (
    <div className="flex h-full flex-col">
      <BoardBar crumbs={[{ label: "All" }]} createHref="/board/new" />

      {empty ? (
        <div className="flex-1">
          <EmptyState />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">
          {/* ---- collections ---- */}
          {sortedBoards.length > 0 && (
            <div className="mb-9 flex flex-wrap gap-9">
              {sortedBoards.map((b) => {
                const members = entities.filter((e) => e.boardId === b.id);
                const pics = members.flatMap((e) => e.images);
                return (
                  <div key={b.id} className="w-[190px]">
                    <Link
                      href={`/board/c/${b.id}`}
                      className="block overflow-hidden rounded-xl border border-line transition-all hover:border-line2"
                    >
                      <Mosaic images={pics.map((p) => p.src)} />
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] font-semibold">
                        {b.name}
                      </span>
                      <button
                        aria-label={b.pinned ? "Unpin collection" : "Pin collection"}
                        aria-pressed={b.pinned}
                        onClick={() => togglePin(b.id)}
                        className={cx(
                          "shrink-0 transition-colors",
                          b.pinned ? "text-ink" : "text-faint hover:text-dim",
                        )}
                      >
                        <Pin
                          size={12}
                          fill={b.pinned ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                    <p className="text-[10.5px] text-faint">
                      {pics.length} {pics.length === 1 ? "pic" : "pics"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/*
            Entities created straight from the editor with /c or /p have no
            picture yet, so they'd be invisible in a gallery. They get a plain
            list of their own rather than quietly disappearing.
          */}
          {noArtwork.length > 0 && (
            <div className="mb-7">
              <p className="mb-2 text-[11px] uppercase tracking-wider text-faint">
                No picture yet
              </p>
              <div className="flex flex-wrap gap-1.5">
                {noArtwork.map((e) => (
                  <Link
                    key={e.id}
                    href={`/board/e/${e.id}`}
                    className="rounded-lg border border-line bg-raise/60 px-2.5 py-1.5 text-[12px] text-dim transition-colors hover:border-accent/50 hover:text-ink"
                  >
                    {e.name}
                    <span className="ml-1.5 text-[10px] text-faint">
                      {ENTITY_KINDS.find((k) => k.kind === e.kind)?.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ---- saved pictures ---- */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[27px] font-bold leading-none">
              Your saved pic&apos;s
            </h2>
            <div className="relative">
              <button
                aria-label="Filter and sort"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((v) => !v)}
                className={cx(
                  "rounded-md p-1.5 transition-colors",
                  filtersOpen ? "bg-raise2 text-ink" : "text-dim hover:text-ink",
                )}
              >
                <SlidersHorizontal size={17} strokeWidth={1.6} />
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-line2 bg-panel p-2 shadow-2xl">
                  <p className="px-1 pb-1 text-[10.5px] uppercase tracking-wider text-faint">
                    Sort
                  </p>
                  {(
                    [
                      ["recent", "Recently updated"],
                      ["name", "Name"],
                      ["kind", "Entity type"],
                    ] as [SortKey, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setSort(k)}
                      className={cx(
                        "block w-full rounded-md px-2 py-1.5 text-left text-[12px]",
                        sort === k
                          ? "bg-accent/10 text-accent"
                          : "text-dim hover:bg-raise2 hover:text-ink",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="my-1.5 h-px bg-line" />
                  <p className="px-1 pb-1 text-[10.5px] uppercase tracking-wider text-faint">
                    Type
                  </p>
                  <button
                    onClick={() => setKindFilter("all")}
                    className={cx(
                      "block w-full rounded-md px-2 py-1.5 text-left text-[12px]",
                      kindFilter === "all"
                        ? "bg-accent/10 text-accent"
                        : "text-dim hover:bg-raise2 hover:text-ink",
                    )}
                  >
                    All types
                  </button>
                  {ENTITY_KINDS.filter((k) =>
                    withImages.some((e) => e.kind === k.kind),
                  ).map((k) => (
                    <button
                      key={k.kind}
                      onClick={() => setKindFilter(k.kind)}
                      className={cx(
                        "block w-full rounded-md px-2 py-1.5 text-left text-[12px]",
                        kindFilter === k.kind
                          ? "bg-accent/10 text-accent"
                          : "text-dim hover:bg-raise2 hover:text-ink",
                      )}
                    >
                      {k.plural}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {shots.length === 0 ? (
            <p className="py-16 text-center text-[13px] text-faint">
              No images yet. Create an entity and add a reference picture.
            </p>
          ) : (
            <div className="ig-masonry columns-2 sm:columns-3 lg:columns-4 xl:columns-5">
              {shots.map(({ img, entity }) => (
                <Link
                  key={img.id}
                  href={`/board/e/${entity.id}`}
                  className="group relative block overflow-hidden rounded-xl border border-line transition-all hover:border-accent/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={`${entity.name} reference`}
                    loading="lazy"
                    className="w-full"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-2 pt-6 text-[11px] text-ink opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    {entity.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The 1-big + 2-stacked tile arrangement from the collection cards. */
function Mosaic({ images }: { images: string[] }) {
  const [a, b, c] = images;
  if (!a) {
    return (
      <div className="grid aspect-[190/108] place-items-center bg-raise text-faint">
        <ImageOff size={18} strokeWidth={1.6} />
      </div>
    );
  }
  return (
    <div className="grid aspect-[190/108] grid-cols-3 gap-[3px] bg-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a}
        alt=""
        className="col-span-2 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="grid grid-rows-2 gap-[3px]">
        {[b, c].map((src, i) =>
          src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div key={i} className="bg-raise" />
          ),
        )}
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2.5 px-3 pt-3">
        <div className="h-8 flex-1 rounded-lg border border-line2 bg-void" />
        <div className="h-8 w-[86px] rounded-lg bg-raise2" />
      </div>
      <div className="flex-1 px-5 pt-5">
        <div className="flex gap-9">
          {[0, 1].map((i) => (
            <div key={i} className="w-[190px]">
              <div className="aspect-[190/108] animate-pulse rounded-xl bg-raise" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-raise" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
