import type {
  FlowTemplateId,
  StoredFlowEdge,
  StoredFlowNode,
} from "./types";

export type TemplateDef = {
  id: FlowTemplateId;
  name: string;
  blurb: string;
  build: () => { nodes: StoredFlowNode[]; edges: StoredFlowEdge[] };
};

function chain(
  labels: string[],
  opts: { x?: number; y?: number; gap?: number; type?: string } = {},
) {
  const { x = 60, y = 180, gap = 230, type = "beat" } = opts;
  const nodes: StoredFlowNode[] = labels.map((label, i) => ({
    id: `n${i + 1}`,
    type,
    position: { x: x + i * gap, y },
    data: { label },
  }));
  const edges: StoredFlowEdge[] = labels.slice(1).map((_, i) => ({
    id: `e${i + 1}`,
    source: `n${i + 1}`,
    target: `n${i + 2}`,
  }));
  return { nodes, edges };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "story",
    name: "Story flow",
    blurb: "Plan plot progression",
    build: () =>
      chain([
        "Beginning",
        "Inciting Incident",
        "Rising Conflict",
        "Climax",
        "Resolution",
      ]),
  },
  {
    id: "relationship",
    name: "Relationship flow",
    blurb: "Character connections",
    build: () => ({
      nodes: [
        { id: "n1", type: "character", position: { x: 340, y: 60 }, data: { label: "Protagonist" } },
        { id: "n2", type: "character", position: { x: 120, y: 240 }, data: { label: "Ally" } },
        { id: "n3", type: "character", position: { x: 560, y: 240 }, data: { label: "Rival" } },
        { id: "n4", type: "character", position: { x: 340, y: 400 }, data: { label: "Antagonist" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", label: "trusts" },
        { id: "e2", source: "n1", target: "n3", label: "competes with" },
        { id: "e3", source: "n3", target: "n4", label: "serves" },
        { id: "e4", source: "n1", target: "n4", label: "opposes" },
      ],
    }),
  },
  {
    id: "timeline",
    name: "Timeline flow",
    blurb: "Chronological events",
    build: () => ({
      ...chain(
        ["Before the story", "Event I", "Event II", "Event III", "Present day"],
        { type: "event", gap: 210 },
      ),
    }),
  },
  {
    id: "arc",
    name: "Character arc",
    blurb: "How one person changes",
    build: () =>
      chain(
        ["Initial State", "Challenge", "Conflict", "Change", "Final State"],
        { type: "character" },
      ),
  },
  {
    id: "cause",
    name: "Cause & consequence",
    blurb: "What each choice costs",
    build: () =>
      chain([
        "Event",
        "Reaction",
        "Consequence",
        "New Problem",
        "Escalation",
      ]),
  },
  {
    id: "scratch",
    name: "Custom flow",
    blurb: "Completely blank canvas",
    build: () => ({ nodes: [], edges: [] }),
  },
];

export function templateById(id: FlowTemplateId) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[TEMPLATES.length - 1];
}
