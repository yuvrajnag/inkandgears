"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cx } from "@/components/ui/primitives";

const STATUS_DOT: Record<string, string> = {
  idea: "#4a4a4a",
  outline: "#8a6d3b",
  draft: "#1bb4f0",
  revised: "#7a5fa8",
  final: "#35d39a",
};

export function SceneTree({ onClose }: { onClose: () => void }) {
  const volumes = useStore((s) => s.volumes);
  const chapters = useStore((s) => s.chapters);
  const scenes = useStore((s) => s.scenes);
  const activeSceneId = useStore((s) => s.activeSceneId);
  const setActiveScene = useStore((s) => s.setActiveScene);
  const addChapter = useStore((s) => s.addChapter);
  const addScene = useStore((s) => s.addScene);
  const addVolume = useStore((s) => s.addVolume);
  const duplicateScene = useStore((s) => s.duplicateScene);
  const removeScene = useStore((s) => s.removeScene);
  const moveScene = useStore((s) => s.moveScene);
  const removeChapter = useStore((s) => s.removeChapter);
  const renameChapter = useStore((s) => s.renameChapter);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-line bg-void">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-[12px] font-medium">Manuscript</h2>
        <button
          aria-label="Close manuscript panel"
          onClick={onClose}
          className="rounded p-0.5 text-dim transition-colors hover:text-ink"
        >
          <X size={13} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {volumes
          .sort((a, b) => a.order - b.order)
          .map((vol) => (
            <div key={vol.id} className="mb-1.5">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-faint">
                {vol.title}
              </p>

              {chapters
                .filter((c) => c.volumeId === vol.id)
                .sort((a, b) => a.order - b.order)
                .map((ch) => {
                  const open = !collapsed.has(ch.id);
                  const list = scenes
                    .filter((s) => s.chapterId === ch.id)
                    .sort((a, b) => a.order - b.order);
                  return (
                    <div key={ch.id} className="mb-0.5">
                      <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-raise">
                        <button
                          aria-label={open ? "Collapse chapter" : "Expand chapter"}
                          onClick={() => toggle(ch.id)}
                          className="text-faint transition-colors hover:text-ink"
                        >
                          {open ? (
                            <ChevronDown size={12} />
                          ) : (
                            <ChevronRight size={12} />
                          )}
                        </button>
                        <input
                          value={ch.title}
                          onChange={(e) => renameChapter(ch.id, e.target.value)}
                          aria-label="Chapter title"
                          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none focus:text-accent-soft"
                        />
                        <button
                          aria-label={`Add scene to ${ch.title}`}
                          onClick={() => addScene(ch.id)}
                          className="hidden text-faint transition-colors hover:text-ink group-hover:block"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          aria-label={`Delete ${ch.title}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${ch.title}" and its ${list.length} scene${list.length === 1 ? "" : "s"}?`,
                              )
                            )
                              removeChapter(ch.id);
                          }}
                          className="hidden text-faint transition-colors hover:text-red-400 group-hover:block"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {open &&
                        list.map((sc) => (
                          <div
                            key={sc.id}
                            className={cx(
                              "group ml-4 flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
                              sc.id === activeSceneId
                                ? "bg-accent/10"
                                : "hover:bg-raise",
                            )}
                          >
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: STATUS_DOT[sc.status] }}
                            />
                            <button
                              onClick={() => setActiveScene(sc.id)}
                              className={cx(
                                "min-w-0 flex-1 truncate text-left text-[11.5px]",
                                sc.id === activeSceneId
                                  ? "text-accent"
                                  : "text-dim",
                              )}
                            >
                              {sc.title}
                            </button>
                            <span className="shrink-0 text-[9.5px] text-faint group-hover:hidden">
                              {sc.words}
                            </span>
                            <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                              <IconMini
                                label="Move up"
                                onClick={() => moveScene(sc.id, -1)}
                              >
                                <ArrowUp size={10} />
                              </IconMini>
                              <IconMini
                                label="Move down"
                                onClick={() => moveScene(sc.id, 1)}
                              >
                                <ArrowDown size={10} />
                              </IconMini>
                              <IconMini
                                label="Duplicate scene"
                                onClick={() => duplicateScene(sc.id)}
                              >
                                <Copy size={10} />
                              </IconMini>
                              <IconMini
                                label="Delete scene"
                                danger
                                onClick={() => {
                                  if (confirm(`Delete "${sc.title}"?`))
                                    removeScene(sc.id);
                                }}
                              >
                                <Trash2 size={10} />
                              </IconMini>
                            </span>
                          </div>
                        ))}
                    </div>
                  );
                })}

              <button
                onClick={() => addChapter(vol.id)}
                className="ml-1 mt-0.5 flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-faint transition-colors hover:text-ink"
              >
                <Plus size={11} /> Chapter
              </button>
            </div>
          ))}
      </div>

      <button
        onClick={() => addVolume(`Volume ${volumes.length + 1}`)}
        className="flex items-center gap-1 border-t border-line px-3 py-2 text-[11px] text-faint transition-colors hover:text-ink"
      >
        <Plus size={11} /> Volume
      </button>
    </aside>
  );
}

function IconMini({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "rounded p-0.5 text-faint transition-colors",
        danger ? "hover:text-red-400" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
