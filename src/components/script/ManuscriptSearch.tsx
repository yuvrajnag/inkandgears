"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, docToText } from "@/lib/store";
import { Input, Modal, cx } from "@/components/ui/primitives";
import { ENTITY_KINDS } from "@/lib/types";
import { routes } from "@/lib/routes";

type Hit =
  | { kind: "scene"; id: string; title: string; excerpt: string; where: string }
  | { kind: "entity"; id: string; title: string; excerpt: string; where: string }
  | { kind: "flow"; id: string; title: string; excerpt: string; where: string };

/** Fuzzy-ish project search: exact and partial matching across everything. */
export function ManuscriptSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const scenes = useStore((s) => s.scenes);
  const chapters = useStore((s) => s.chapters);
  const entities = useStore((s) => s.entities);
  const flows = useStore((s) => s.flows);
  const setActiveScene = useStore((s) => s.setActiveScene);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "scene" | "entity" | "flow">(
    "all",
  );

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const out: Hit[] = [];

    for (const sc of scenes) {
      const text = docToText(sc.doc);
      const inTitle = sc.title.toLowerCase().includes(term);
      const at = text.toLowerCase().indexOf(term);
      if (!inTitle && at < 0) continue;
      const chapter = chapters.find((c) => c.id === sc.chapterId);
      out.push({
        kind: "scene",
        id: sc.id,
        title: sc.title,
        where: chapter?.title ?? "",
        excerpt:
          at >= 0
            ? `…${text.slice(Math.max(0, at - 50), at + 90).trim()}…`
            : sc.summary || `${sc.words} words`,
      });
    }

    for (const e of entities) {
      const hay = `${e.name} ${e.description} ${e.details
        .map((d) => `${d.label} ${d.value}`)
        .join(" ")}`.toLowerCase();
      if (!hay.includes(term)) continue;
      out.push({
        kind: "entity",
        id: e.id,
        title: e.name,
        where: ENTITY_KINDS.find((k) => k.kind === e.kind)?.label ?? e.kind,
        excerpt: e.description.slice(0, 130) || "No description yet",
      });
    }

    for (const f of flows) {
      const hay = `${f.name} ${f.description} ${f.nodes
        .map((n) => n.data.label)
        .join(" ")}`.toLowerCase();
      if (!hay.includes(term)) continue;
      out.push({
        kind: "flow",
        id: f.id,
        title: f.name,
        where: f.scope,
        excerpt: f.nodes
          .map((n) => n.data.label)
          .slice(0, 6)
          .join(" → "),
      });
    }

    return out;
  }, [q, scenes, chapters, entities, flows]);

  const shown = hits.filter((h) => filter === "all" || h.kind === filter);

  function open(hit: Hit) {
    if (hit.kind === "scene") {
      setActiveScene(hit.id);
      onClose();
    } else if (hit.kind === "entity") {
      router.push(routes.entity(hit.id));
      onClose();
    } else {
      router.push(routes.flowView(hit.id));
      onClose();
    }
  }

  return (
    <Modal title="Search project" onClose={onClose} width="max-w-2xl">
      <div className="space-y-3">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search scenes, characters, places, flows…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown[0]) open(shown[0]);
          }}
        />

        <div className="flex gap-1.5">
          {(
            [
              ["all", "Everything"],
              ["scene", "Scenes"],
              ["entity", "World Matrix"],
              ["flow", "Flows"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cx(
                "rounded-md border px-2 py-1 text-[11.5px] transition-colors",
                filter === k
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-line2 text-dim hover:text-ink",
              )}
            >
              {label}
              {k !== "all" && (
                <span className="ml-1 text-faint">
                  {hits.filter((h) => h.kind === k).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {q.trim().length < 2 ? (
          <p className="py-8 text-center text-[12px] text-faint">
            Type at least two characters.
          </p>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-faint">
            No matches for “{q.trim()}”.
          </p>
        ) : (
          <ul className="max-h-[46vh] space-y-1.5 overflow-y-auto">
            {shown.map((h) => (
              <li key={`${h.kind}-${h.id}`}>
                <button
                  onClick={() => open(h)}
                  className="w-full rounded-lg border border-line2 bg-raise px-3 py-2 text-left transition-colors hover:border-accent/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[12.5px]">{h.title}</span>
                    <span className="shrink-0 text-[10px] text-faint">
                      {h.where}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-dim">
                    {h.excerpt}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
