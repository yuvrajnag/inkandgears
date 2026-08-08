"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore, collectRefs } from "@/lib/store";
import {
  Chip,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import type { Scene, SceneStatus } from "@/lib/types";

const STATUSES: SceneStatus[] = ["idea", "outline", "draft", "revised", "final"];

export function SceneMeta({
  scene,
  onClose,
}: {
  scene: Scene;
  onClose: () => void;
}) {
  const updateScene = useStore((s) => s.updateScene);
  const entities = useStore((s) => s.entities);

  /* Everything this scene contains, read straight out of the prose. */
  const present = useMemo(() => {
    const ids = collectRefs(scene.doc);
    return entities
      .filter((e) => ids.has(e.id))
      .map((e) => ({ entity: e, count: ids.get(e.id) ?? 0 }));
  }, [scene.doc, entities]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof present>();
    for (const p of present) {
      map.set(p.entity.kind, [...(map.get(p.entity.kind) ?? []), p]);
    }
    return [...map.entries()];
  }, [present]);

  return (
    <Modal title="Scene" onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={scene.title}
            onChange={(e) => updateScene(scene.id, { title: e.target.value })}
          />
        </div>

        <div>
          <Label>Summary</Label>
          <Textarea
            rows={2}
            value={scene.summary}
            onChange={(e) => updateScene(scene.id, { summary: e.target.value })}
            placeholder="One line — what happens here."
          />
        </div>

        <div>
          <Label>Objective</Label>
          <Input
            value={scene.objective}
            onChange={(e) =>
              updateScene(scene.id, { objective: e.target.value })
            }
            placeholder="Why this scene exists."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>POV</Label>
            <Input
              value={scene.pov}
              onChange={(e) => updateScene(scene.id, { pov: e.target.value })}
              placeholder="Whose eyes"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={scene.status}
              onChange={(e) =>
                updateScene(scene.id, {
                  status: e.target.value as SceneStatus,
                })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={scene.notes}
            onChange={(e) => updateScene(scene.id, { notes: e.target.value })}
            placeholder="For your eyes only."
          />
        </div>

        <div>
          <Label>In this scene</Label>
          {grouped.length === 0 ? (
            <p className="rounded-[10px] border border-line2 bg-raise px-3 py-2.5 text-[11.5px] text-faint">
              Nothing linked yet. Type <code className="font-mono">/c</code> or{" "}
              <code className="font-mono">/p</code> while writing and this fills
              itself in.
            </p>
          ) : (
            <div className="space-y-2 rounded-[10px] border border-line2 bg-raise p-3">
              {grouped.map(([kind, list]) => (
                <div key={kind}>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-faint">
                    {kind}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(({ entity, count }) => (
                      <Link key={entity.id} href={`/board/e/${entity.id}`}>
                        <Chip tone="muted">
                          {entity.name}
                          {count > 1 && (
                            <span className="ml-1 text-faint">×{count}</span>
                          )}
                        </Chip>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-faint">
          {scene.words} words · last saved{" "}
          {new Date(scene.updatedAt).toLocaleString()}
        </p>
      </div>
    </Modal>
  );
}
