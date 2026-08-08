"use client";

import { useMemo } from "react";
import { useStore, docToText } from "@/lib/store";
import { Button, Modal } from "@/components/ui/primitives";

export function VersionHistory({
  sceneId,
  onClose,
}: {
  sceneId: string;
  onClose: () => void;
}) {
  const versions = useStore((s) => s.versions);
  const scene = useStore((s) => s.scenes.find((x) => x.id === sceneId));
  const restore = useStore((s) => s.restore);
  const snapshot = useStore((s) => s.snapshot);

  const mine = useMemo(
    () =>
      versions
        .filter((v) => v.targetKind === "scene" && v.targetId === sceneId)
        .sort((a, b) => b.at - a.at),
    [versions, sceneId],
  );

  const current = scene ? docToText(scene.doc).trim() : "";

  return (
    <Modal title="Version history" onClose={onClose} width="max-w-xl">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-dim">
            Restore points are taken automatically as you write.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              scene && snapshot("scene", scene.id, scene.title, scene.doc)
            }
          >
            Save one now
          </Button>
        </div>

        {mine.length === 0 ? (
          <p className="rounded-xl border border-line2 bg-raise px-3 py-6 text-center text-[12px] text-faint">
            No restore points for this scene yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {mine.map((v) => {
              const text = docToText(v.snapshot).trim();
              const delta =
                (text.split(/\s+/).filter(Boolean).length || 0) -
                (current.split(/\s+/).filter(Boolean).length || 0);
              return (
                <li
                  key={v.id}
                  className="rounded-xl border border-line2 bg-raise p-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[12px]">
                      {new Date(v.at).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-faint">
                      {delta === 0
                        ? "same length"
                        : delta > 0
                          ? `${delta} words more than now`
                          : `${Math.abs(delta)} words fewer than now`}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-dim">
                    {text.slice(0, 220) || "(empty)"}
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "Restore this version? The current text is snapshotted first, so this is reversible.",
                          )
                        ) {
                          if (scene)
                            snapshot(
                              "scene",
                              scene.id,
                              `${scene.title} (before restore)`,
                              scene.doc,
                            );
                          restore(v.id);
                          onClose();
                        }
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
