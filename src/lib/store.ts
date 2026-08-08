"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { buildSeed } from "./seed";
import { buildGameSeed } from "./game/seed";
import type { GameNarrative } from "./game/types";
import type {
  Appearance,
  Board,
  Chapter,
  Detail,
  Entity,
  EntityImage,
  Flow,
  FlowTemplateId,
  Relationship,
  Scene,
  StoredFlowEdge,
  StoredFlowNode,
  Version,
  Volume,
} from "./types";

export type Draft = {
  boards: Board[];
  entities: Entity[];
  relationships: Relationship[];
  volumes: Volume[];
  chapters: Chapter[];
  scenes: Scene[];
  flows: Flow[];
  versions: Version[];
  projectName: string;
  /** Draft Canvas selection */
  activeSceneId: string | null;
  simpleMode: boolean;
  focusMode: boolean;
  lastSavedAt: number | null;
  /** Phase 2 — Game Narrative Studio */
  narrative: GameNarrative;
};

type Actions = {
  // Boards
  addBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  togglePin: (id: string) => void;
  removeBoard: (id: string) => void;

  // Entities
  addEntity: (init: Partial<Entity> & { name: string }) => string;
  updateEntity: (id: string, patch: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  addEntityImage: (id: string, img: EntityImage) => void;
  removeEntityImage: (id: string, imageId: string) => void;
  setCover: (id: string, index: number) => void;
  addDetail: (id: string, d: Omit<Detail, "id">) => void;
  updateDetail: (id: string, detailId: string, patch: Partial<Detail>) => void;
  removeDetail: (id: string, detailId: string) => void;

  // Relationships
  addRelationship: (r: Omit<Relationship, "id">) => void;
  removeRelationship: (id: string) => void;

  // Script
  addVolume: (title: string) => string;
  addChapter: (volumeId: string, title?: string) => string;
  renameChapter: (id: string, title: string) => void;
  removeChapter: (id: string) => void;
  addScene: (chapterId: string, title?: string) => string;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  duplicateScene: (id: string) => string | null;
  moveScene: (id: string, dir: -1 | 1) => void;
  removeScene: (id: string) => void;
  setActiveScene: (id: string | null) => void;

  // Flows
  addFlow: (f: Partial<Flow> & { name: string }) => string;
  updateFlow: (id: string, patch: Partial<Flow>) => void;
  removeFlow: (id: string) => void;
  saveFlowGraph: (
    id: string,
    nodes: StoredFlowNode[],
    edges: StoredFlowEdge[],
  ) => void;

  // Cosmos
  snapshot: (
    targetKind: Version["targetKind"],
    targetId: string,
    label: string,
    data: unknown,
  ) => void;
  restore: (versionId: string) => void;
  markSaved: () => void;
  setSimpleMode: (v: boolean) => void;
  setFocusMode: (v: boolean) => void;
  setProjectName: (v: string) => void;
  resetProject: () => void;
  importProject: (data: Partial<Draft>) => void;

  // Game Narrative Studio
  updateNarrative: (patch: Partial<GameNarrative>) => void;
};

export type Store = Draft & Actions;

function initial(): Draft {
  const seed = buildSeed();
  return {
    ...seed,
    relationships: [
      { id: nanoid(8), fromId: "en_hero", toId: "en_haven", kind: "lives in" },
      { id: nanoid(8), fromId: "en_knight", toId: "en_order", kind: "belongs to" },
      { id: nanoid(8), fromId: "en_hero", toId: "en_rival", kind: "knows" },
      { id: nanoid(8), fromId: "en_sword", toId: "en_knight", kind: "owned by" },
    ],
    versions: [],
    projectName: "Aetherfall Haven",
    activeSceneId: "sc_1",
    simpleMode: false,
    focusMode: false,
    lastSavedAt: null,
    narrative: buildGameSeed(),
  };
}

const MAX_VERSIONS = 60;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial(),

      // ---------- Boards ----------
      addBoard: (name) => {
        const id = `bd_${nanoid(8)}`;
        set((s) => ({
          boards: [
            ...s.boards,
            { id, name: name.trim() || "Untitled board", pinned: false, createdAt: Date.now() },
          ],
        }));
        return id;
      },
      renameBoard: (id, name) =>
        set((s) => ({
          boards: s.boards.map((b) => (b.id === id ? { ...b, name } : b)),
        })),
      togglePin: (id) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === id ? { ...b, pinned: !b.pinned } : b,
          ),
        })),
      removeBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          // Entities survive their board — deleting a collection must never
          // delete the writing that references it.
          entities: s.entities.map((e) =>
            e.boardId === id ? { ...e, boardId: null } : e,
          ),
        })),

      // ---------- Entities ----------
      addEntity: (init) => {
        const id = `en_${nanoid(8)}`;
        const t = Date.now();
        set((s) => ({
          entities: [
            ...s.entities,
            {
              id,
              name: init.name,
              kind: init.kind ?? "character",
              boardId: init.boardId ?? null,
              description: init.description ?? "",
              images: init.images ?? [],
              coverIndex: 0,
              details: init.details ?? [],
              notes: "",
              createdAt: t,
              updatedAt: t,
            },
          ],
        }));
        return id;
      },
      updateEntity: (id, patch) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e,
          ),
        })),
      removeEntity: (id) =>
        set((s) => ({
          entities: s.entities.filter((e) => e.id !== id),
          relationships: s.relationships.filter(
            (r) => r.fromId !== id && r.toId !== id,
          ),
        })),
      addEntityImage: (id, img) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id
              ? { ...e, images: [...e.images, img], updatedAt: Date.now() }
              : e,
          ),
        })),
      removeEntityImage: (id, imageId) =>
        set((s) => ({
          entities: s.entities.map((e) => {
            if (e.id !== id) return e;
            const images = e.images.filter((i) => i.id !== imageId);
            return {
              ...e,
              images,
              coverIndex: Math.min(e.coverIndex, Math.max(0, images.length - 1)),
              updatedAt: Date.now(),
            };
          }),
        })),
      setCover: (id, index) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id ? { ...e, coverIndex: index } : e,
          ),
        })),
      addDetail: (id, d) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id
              ? {
                  ...e,
                  details: [...e.details, { ...d, id: nanoid(8) }],
                  updatedAt: Date.now(),
                }
              : e,
          ),
        })),
      updateDetail: (id, detailId, patch) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id
              ? {
                  ...e,
                  details: e.details.map((d) =>
                    d.id === detailId ? { ...d, ...patch } : d,
                  ),
                  updatedAt: Date.now(),
                }
              : e,
          ),
        })),
      removeDetail: (id, detailId) =>
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === id
              ? {
                  ...e,
                  details: e.details.filter((d) => d.id !== detailId),
                  updatedAt: Date.now(),
                }
              : e,
          ),
        })),

      // ---------- Relationships ----------
      addRelationship: (r) =>
        set((s) => ({
          relationships: [...s.relationships, { ...r, id: nanoid(8) }],
        })),
      removeRelationship: (id) =>
        set((s) => ({
          relationships: s.relationships.filter((r) => r.id !== id),
        })),

      // ---------- Script ----------
      addVolume: (title) => {
        const id = `vol_${nanoid(6)}`;
        set((s) => ({
          volumes: [...s.volumes, { id, title, order: s.volumes.length }],
        }));
        return id;
      },
      addChapter: (volumeId, title) => {
        const id = `ch_${nanoid(6)}`;
        set((s) => {
          const siblings = s.chapters.filter((c) => c.volumeId === volumeId);
          return {
            chapters: [
              ...s.chapters,
              {
                id,
                volumeId,
                title: title ?? `Chapter ${siblings.length + 1}`,
                order: siblings.length,
              },
            ],
          };
        });
        return id;
      },
      renameChapter: (id, title) =>
        set((s) => ({
          chapters: s.chapters.map((c) => (c.id === id ? { ...c, title } : c)),
        })),
      removeChapter: (id) =>
        set((s) => ({
          chapters: s.chapters.filter((c) => c.id !== id),
          scenes: s.scenes.filter((sc) => sc.chapterId !== id),
        })),
      addScene: (chapterId, title) => {
        const id = `sc_${nanoid(6)}`;
        set((s) => {
          const siblings = s.scenes.filter((x) => x.chapterId === chapterId);
          return {
            scenes: [
              ...s.scenes,
              {
                id,
                chapterId,
                title: title ?? `Scene ${siblings.length + 1}`,
                doc: { type: "doc", content: [{ type: "paragraph" }] },
                summary: "",
                objective: "",
                pov: "",
                status: "idea" as const,
                notes: "",
                order: siblings.length,
                words: 0,
                updatedAt: Date.now(),
              },
            ],
            activeSceneId: id,
          };
        });
        return id;
      },
      updateScene: (id, patch) =>
        set((s) => ({
          scenes: s.scenes.map((sc) =>
            sc.id === id ? { ...sc, ...patch, updatedAt: Date.now() } : sc,
          ),
        })),
      duplicateScene: (id) => {
        const src = get().scenes.find((s) => s.id === id);
        if (!src) return null;
        const newId = `sc_${nanoid(6)}`;
        set((s) => ({
          scenes: [
            ...s.scenes,
            {
              ...src,
              id: newId,
              title: `${src.title} (copy)`,
              order: src.order + 0.5,
              updatedAt: Date.now(),
            },
          ].sort((a, b) => a.order - b.order),
          activeSceneId: newId,
        }));
        return newId;
      },
      moveScene: (id, dir) =>
        set((s) => {
          const scene = s.scenes.find((x) => x.id === id);
          if (!scene) return {};
          const siblings = s.scenes
            .filter((x) => x.chapterId === scene.chapterId)
            .sort((a, b) => a.order - b.order);
          const i = siblings.findIndex((x) => x.id === id);
          const j = i + dir;
          if (j < 0 || j >= siblings.length) return {};
          const reordered = [...siblings];
          [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
          const orderById = new Map(reordered.map((x, k) => [x.id, k]));
          return {
            scenes: s.scenes.map((x) =>
              orderById.has(x.id) ? { ...x, order: orderById.get(x.id)! } : x,
            ),
          };
        }),
      removeScene: (id) =>
        set((s) => {
          const rest = s.scenes.filter((x) => x.id !== id);
          return {
            scenes: rest,
            activeSceneId:
              s.activeSceneId === id ? (rest[0]?.id ?? null) : s.activeSceneId,
          };
        }),
      setActiveScene: (id) => set({ activeSceneId: id }),

      // ---------- Flows ----------
      addFlow: (f) => {
        const id = `fl_${nanoid(8)}`;
        const t = Date.now();
        set((s) => ({
          flows: [
            ...s.flows,
            {
              id,
              name: f.name,
              template: (f.template ?? "scratch") as FlowTemplateId,
              description: f.description ?? "",
              scope: f.scope ?? "Entire Story",
              direction: f.direction ?? "Linear",
              goal: f.goal ?? "",
              nodes: f.nodes ?? [],
              edges: f.edges ?? [],
              createdAt: t,
              updatedAt: t,
            },
          ],
        }));
        return id;
      },
      updateFlow: (id, patch) =>
        set((s) => ({
          flows: s.flows.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f,
          ),
        })),
      removeFlow: (id) =>
        set((s) => ({ flows: s.flows.filter((f) => f.id !== id) })),
      saveFlowGraph: (id, nodes, edges) =>
        set((s) => ({
          flows: s.flows.map((f) =>
            f.id === id ? { ...f, nodes, edges, updatedAt: Date.now() } : f,
          ),
        })),

      // ---------- Cosmos ----------
      snapshot: (targetKind, targetId, label, data) =>
        set((s) => ({
          versions: [
            {
              id: nanoid(10),
              targetId,
              targetKind,
              label,
              at: Date.now(),
              snapshot: data,
            },
            ...s.versions,
          ].slice(0, MAX_VERSIONS),
        })),
      restore: (versionId) => {
        const v = get().versions.find((x) => x.id === versionId);
        if (!v) return;
        if (v.targetKind === "scene") {
          get().updateScene(v.targetId, { doc: v.snapshot });
        } else if (v.targetKind === "entity") {
          get().updateEntity(v.targetId, v.snapshot as Partial<Entity>);
        } else if (v.targetKind === "flow") {
          get().updateFlow(v.targetId, v.snapshot as Partial<Flow>);
        }
      },
      markSaved: () => set({ lastSavedAt: Date.now() }),
      setSimpleMode: (v) => set({ simpleMode: v }),
      setFocusMode: (v) => set({ focusMode: v }),
      setProjectName: (v) => set({ projectName: v }),
      updateNarrative: (patch) =>
        set((s) => ({ narrative: { ...s.narrative, ...patch } })),
      resetProject: () => set({ ...initial() }),
      importProject: (data) => set((s) => ({ ...s, ...data })),
    }),
    {
      name: "inkandgears.project.v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Saves made before the Game Studio existed have no narrative slice.
      migrate: (persisted, from) => {
        const state = persisted as Partial<Draft>;
        if (from < 2 || !state?.narrative) {
          return { ...state, narrative: buildGameSeed() } as Draft;
        }
        return state as Draft;
      },
      partialize: (s): Draft => ({
        boards: s.boards,
        entities: s.entities,
        relationships: s.relationships,
        volumes: s.volumes,
        chapters: s.chapters,
        scenes: s.scenes,
        flows: s.flows,
        versions: s.versions,
        projectName: s.projectName,
        activeSceneId: s.activeSceneId,
        simpleMode: s.simpleMode,
        focusMode: s.focusMode,
        lastSavedAt: s.lastSavedAt,
        narrative: s.narrative,
      }),
    },
  ),
);

/* ------------------------------------------------------------------ *
 * Derived data — the "write once, structure automatically" half.
 * Appearances are never stored; they are read back out of the script.
 * ------------------------------------------------------------------ */

type DocNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
};

export function collectRefs(doc: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (n: DocNode | undefined) => {
    if (!n || typeof n !== "object") return;
    if (n.type === "entityRef") {
      const id = n.attrs?.entityId;
      if (typeof id === "string") out.set(id, (out.get(id) ?? 0) + 1);
    }
    n.content?.forEach(walk);
  };
  walk(doc as DocNode);
  return out;
}

export function docToText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (n: DocNode | undefined) => {
    if (!n || typeof n !== "object") return;
    if (n.text) parts.push(n.text);
    if (n.type === "entityRef" && typeof n.attrs?.label === "string") {
      parts.push(n.attrs.label);
    }
    if (n.type === "paragraph" || n.type?.startsWith("heading")) parts.push("\n");
    n.content?.forEach(walk);
  };
  walk(doc as DocNode);
  return parts.join("");
}

export function countWords(doc: unknown): number {
  const t = docToText(doc).trim();
  return t ? t.split(/\s+/).length : 0;
}

export function buildAppearances(scenes: Scene[]): Appearance[] {
  const out: Appearance[] = [];
  for (const sc of scenes) {
    for (const [entityId, count] of collectRefs(sc.doc)) {
      out.push({ sceneId: sc.id, entityId, count });
    }
  }
  return out;
}

/** Scenes containing this entity, in whatever order `scenes` was given. */
export function appearancesFor(entityId: string, scenes: Scene[]) {
  return scenes.filter((sc) => collectRefs(sc.doc).has(entityId));
}

/** Ordered reading position of every scene, used for first/last appearance. */
export function readingOrder(scenes: Scene[], chapters: Chapter[]) {
  const chapterOrder = new Map(chapters.map((c) => [c.id, c.order]));
  return [...scenes].sort((a, b) => {
    const ca = chapterOrder.get(a.chapterId) ?? 0;
    const cb = chapterOrder.get(b.chapterId) ?? 0;
    return ca === cb ? a.order - b.order : ca - cb;
  });
}
