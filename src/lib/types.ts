export type EntityKind =
  | "character"
  | "location"
  | "faction"
  | "item"
  | "event"
  | "creature"
  | "vehicle"
  | "scene";

export const ENTITY_KINDS: {
  kind: EntityKind;
  label: string;
  plural: string;
  slash: string;
}[] = [
  { kind: "character", label: "Character", plural: "Characters", slash: "c" },
  { kind: "location", label: "Location", plural: "Locations", slash: "p" },
  { kind: "faction", label: "Faction", plural: "Factions", slash: "f" },
  { kind: "item", label: "Item", plural: "Items", slash: "i" },
  { kind: "event", label: "Event", plural: "Events", slash: "e" },
  { kind: "creature", label: "Creature", plural: "Creatures", slash: "cr" },
  { kind: "vehicle", label: "Vehicle", plural: "Vehicles", slash: "v" },
  { kind: "scene", label: "Scene", plural: "Scenes", slash: "s" },
];

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "multi"
  | "date"
  | "color"
  | "ref";

export type Detail = {
  id: string;
  /** Empty label renders as a bare value chip (a colour swatch, a one-word tag). */
  label: string;
  value: string;
  type: FieldType;
};

/** A Board is a World Matrix collection — "Character's", "Location's", … */
export type Board = {
  id: string;
  name: string;
  pinned: boolean;
  createdAt: number;
};

export type EntityImage = {
  id: string;
  /** Either a remote URL or a data URL from a local upload. */
  src: string;
  name?: string;
};

export type Entity = {
  id: string;
  name: string;
  kind: EntityKind;
  boardId: string | null;
  description: string;
  images: EntityImage[];
  coverIndex: number;
  details: Detail[];
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type RelationshipKind =
  | "lives in"
  | "belongs to"
  | "knows"
  | "owned by"
  | "takes place in"
  | "involves"
  | "rules"
  | "allied with"
  | "enemy of";

export type Relationship = {
  id: string;
  fromId: string;
  toId: string;
  kind: RelationshipKind;
};

export type SceneStatus = "idea" | "outline" | "draft" | "revised" | "final";

export type Scene = {
  id: string;
  chapterId: string;
  title: string;
  /** Tiptap JSON. Stored opaque; entity refs are extracted from it. */
  doc: unknown;
  summary: string;
  objective: string;
  pov: string;
  status: SceneStatus;
  notes: string;
  order: number;
  words: number;
  updatedAt: number;
};

export type Chapter = {
  id: string;
  volumeId: string;
  title: string;
  order: number;
};

export type Volume = {
  id: string;
  title: string;
  order: number;
};

export type FlowScope =
  | "Entire Story"
  | "Character"
  | "Chapter"
  | "Scene"
  | "Worldbuilding";

export type FlowDirection =
  | "Linear"
  | "Branching"
  | "Cyclical"
  | "Parallel"
  | "Multi-POV";

export type FlowTemplateId =
  | "story"
  | "relationship"
  | "timeline"
  | "arc"
  | "cause"
  | "scratch";

export type FlowNodeData = {
  label: string;
  note?: string;
  accent?: string;
  kind?: "beat" | "event" | "character" | "group";
};

export type StoredFlowNode = {
  id: string;
  position: { x: number; y: number };
  data: FlowNodeData;
  type: string;
};

export type StoredFlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type Flow = {
  id: string;
  name: string;
  template: FlowTemplateId;
  description: string;
  scope: FlowScope;
  direction: FlowDirection;
  goal: string;
  nodes: StoredFlowNode[];
  edges: StoredFlowEdge[];
  createdAt: number;
  updatedAt: number;
};

/** One entry per (scene, entity) pair, derived from the script — never hand-maintained. */
export type Appearance = {
  sceneId: string;
  entityId: string;
  count: number;
};

export type Version = {
  id: string;
  targetId: string;
  targetKind: "scene" | "entity" | "flow";
  label: string;
  at: number;
  snapshot: unknown;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
};
