import { nanoid } from "nanoid";
import { asset } from "./asset";
import type {
  Board,
  Chapter,
  Detail,
  Entity,
  Flow,
  Scene,
  Volume,
} from "./types";

const now = Date.now();

/**
 * Seed imagery.
 *
 * These are cropped from the project's own design mockups, so the sample story
 * looks the way the reference does. They are screenshot-resolution — swap in
 * the master files (same names, `public/seed/`) for anything shipping.
 */
function art(name: string) {
  return asset(`/seed/${name}.jpg`);
}

function detail(label: string, value: string, type: Detail["type"] = "text") {
  return { id: nanoid(8), label, value, type };
}

/** Tiptap JSON helpers — the seed scenes ship with real entity references. */
function ref(entityId: string, kind: string, label: string) {
  return { type: "entityRef", attrs: { entityId, kind, label } };
}
function txt(text: string) {
  return { type: "text", text };
}
function para(content: unknown[]) {
  return { type: "paragraph", content };
}

export function buildSeed() {
  const boards: Board[] = [
    { id: "bd_char", name: "Character's", pinned: true, createdAt: now },
    { id: "bd_loc", name: "Location's", pinned: false, createdAt: now + 1 },
  ];

  const haven: Entity = {
    id: "en_haven",
    name: "Aetherfall Haven",
    kind: "location",
    boardId: "bd_loc",
    description:
      "Aetherfall Haven is a tranquil skybound sanctuary where the protagonist was born, surrounded by flowing waterfalls, gentle winds, and a community filled with warmth, harmony, and joyful days.",
    images: [
      { id: nanoid(8), src: art("loc-falls"), name: "haven-falls" },
      { id: nanoid(8), src: art("loc-redwood"), name: "haven-dusk" },
      { id: nanoid(8), src: art("loc-blossom"), name: "haven-dawn" },
    ],
    coverIndex: 0,
    details: [
      detail("", "#E397CB", "color"),
      detail("", "Home town"),
      detail("Climate", "Mild breezes, soft sunlight, drifting clouds"),
      detail("Population", "Small peaceful village of about 300", "number"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const gate: Entity = {
    id: "en_gate",
    name: "The Drowned Gate",
    kind: "location",
    boardId: "bd_loc",
    description:
      "A torii standing in still water at the edge of the world. Nobody remembers who raised it, only that it was already old when the Haven was young.",
    images: [{ id: nanoid(8), src: art("loc-torii"), name: "gate" }],
    coverIndex: 0,
    details: [
      detail("Region", "The Shallows"),
      detail("Terrain", "Tidal flats"),
      detail("Landmark", "Torii of the first crossing"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const eclipse: Entity = {
    id: "en_eclipse",
    name: "Umbral Reach",
    kind: "location",
    boardId: "bd_loc",
    description:
      "Where the eclipse never finishes. Light bends the wrong way here and the roads stop agreeing with the maps.",
    images: [{ id: nanoid(8), src: art("loc-eclipse"), name: "eclipse" }],
    coverIndex: 0,
    details: [
      detail("Climate", "Perpetual half-light"),
      detail("Defense", "None. Nothing wants it."),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const shrine: Entity = {
    id: "en_shrine",
    name: "Redleaf Shrine",
    kind: "location",
    boardId: "bd_loc",
    description:
      "A mountain shrine under permanent autumn, kept by a caretaker who has outlived four generations of pilgrims.",
    images: [{ id: nanoid(8), src: art("loc-shrine"), name: "shrine" }],
    coverIndex: 0,
    details: [
      detail("Region", "Redleaf Ridge"),
      detail("Religion", "The Long Autumn"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const hero: Entity = {
    id: "en_hero",
    name: "Kael Aetheris",
    kind: "character",
    boardId: "bd_char",
    description:
      "Born in the Haven, raised on stories about everywhere else. Kael leaves because staying would be the only thing he could never forgive himself for.",
    images: [{ id: nanoid(8), src: art("char-hood"), name: "kael" }],
    coverIndex: 0,
    details: [
      detail("", "#7FD8FF", "color"),
      detail("Age", "19", "number"),
      detail("Role", "Protagonist"),
      detail("Origin", "Aetherfall Haven"),
      detail("Goal", "Find out what the Gate was built to keep out"),
      detail("Fear", "Coming home to nothing"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const elder: Entity = {
    id: "en_elder",
    name: "Village Elder Sora",
    kind: "character",
    boardId: "bd_char",
    description:
      "Keeps the Haven's records and its silences. Knows exactly which of the two matters more.",
    images: [{ id: nanoid(8), src: art("char-glasses"), name: "sora" }],
    coverIndex: 0,
    details: [
      detail("Age", "71", "number"),
      detail("Role", "Mentor"),
      detail("Occupation", "Keeper of the Haven records"),
      detail("Weakness", "Tells the truth too late"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const knight: Entity = {
    id: "en_knight",
    name: "The Fallen Knight",
    kind: "character",
    boardId: "bd_char",
    description:
      "Came through the Gate once and would not say what he saw. He has been walking back toward it ever since.",
    images: [{ id: nanoid(8), src: art("char-suit"), name: "knight" }],
    coverIndex: 0,
    details: [
      detail("Role", "Antagonist"),
      detail("Alignment", "Undecided"),
      detail("Ability", "Cannot be killed by anything he remembers"),
      detail("Affiliation", "Ashen Order"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const rival: Entity = {
    id: "en_rival",
    name: "Yura",
    kind: "character",
    boardId: "bd_char",
    description:
      "Kael's oldest friend and the only person in the Haven who wanted to leave more than he did.",
    images: [{ id: nanoid(8), src: art("char-dark"), name: "yura" }],
    coverIndex: 0,
    details: [
      detail("Age", "20", "number"),
      detail("Role", "Rival"),
      detail("Trait", "Refuses to be second at anything"),
    ],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const order: Entity = {
    id: "en_order",
    name: "The Ashen Order",
    kind: "faction",
    boardId: null,
    description:
      "The people who kept the Gate closed. There are fewer of them every year and none of them will explain why.",
    images: [],
    coverIndex: 0,
    details: [detail("Status", "Waning"), detail("Seat", "Umbral Reach")],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const sword: Entity = {
    id: "en_sword",
    name: "Ancient Sword",
    kind: "item",
    boardId: null,
    description: "Older than the Order, heavier than it looks.",
    images: [],
    coverIndex: 0,
    details: [detail("Status", "Carried by Kael")],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };

  const entities: Entity[] = [
    haven,
    gate,
    eclipse,
    shrine,
    hero,
    elder,
    knight,
    rival,
    order,
    sword,
  ];

  const volumes: Volume[] = [
    { id: "vol_1", title: "Volume I — The Leaving", order: 0 },
  ];

  const chapters: Chapter[] = [
    { id: "ch_1", volumeId: "vol_1", title: "Chapter 1", order: 0 },
    { id: "ch_2", volumeId: "vol_1", title: "Chapter 2", order: 1 },
  ];

  const scenes: Scene[] = [
    {
      id: "sc_1",
      chapterId: "ch_1",
      title: "Hero's spirit awaken",
      doc: {
        type: "doc",
        content: [
          para([
            txt("The morning came down over "),
            ref(haven.id, "location", "Aetherfall Haven"),
            txt(
              " the way it always had, in long sheets of light off the falls, and ",
            ),
            ref(hero.id, "character", "Kael Aetheris"),
            txt(" hated it for being so ordinary."),
          ]),
          para([
            txt(
              "He had counted the bells since he was old enough to count. Four in the morning, four at dusk. Nothing in this village had ever needed a fifth.",
            ),
          ]),
          para([
            ref(elder.id, "character", "Village Elder Sora"),
            txt(
              " found him at the rail, where the water went over and did not come back.",
            ),
          ]),
          para([
            txt(
              "“You’re standing where your mother used to stand,” she said. “She didn’t like the answer either.”",
            ),
          ]),
        ],
      },
      summary: "Kael's last ordinary morning in the Haven.",
      objective: "Establish home so leaving it costs something.",
      pov: "Kael",
      status: "draft",
      notes: "",
      order: 0,
      words: 108,
      updatedAt: now,
    },
    {
      id: "sc_2",
      chapterId: "ch_1",
      title: "The return of holly knights",
      doc: {
        type: "doc",
        content: [
          para([
            txt("They came up the switchback at dusk, and every one of them wore the grey of "),
            ref(order.id, "faction", "The Ashen Order"),
            txt("."),
          ]),
          para([
            ref(rival.id, "character", "Yura"),
            txt(" saw them first, from the high path above "),
            ref(haven.id, "location", "Aetherfall Haven"),
            txt(", and did not go down to tell anyone for a long moment."),
          ]),
        ],
      },
      summary: "The Order arrives. The Haven stops being safe.",
      objective: "Inciting incident.",
      pov: "Yura",
      status: "draft",
      notes: "",
      order: 1,
      words: 61,
      updatedAt: now,
    },
    {
      id: "sc_3",
      chapterId: "ch_2",
      title: "The final strike of haven",
      doc: {
        type: "doc",
        content: [
          para([
            txt("What was left of "),
            ref(haven.id, "location", "Aetherfall Haven"),
            txt(" fit in the space between two breaths."),
          ]),
          para([
            ref(knight.id, "character", "The Fallen Knight"),
            txt(" stood in the square with "),
            ref(sword.id, "item", "Ancient Sword"),
            txt(" point-down in the stone, waiting to be recognised."),
          ]),
        ],
      },
      summary: "The Haven falls. Kael leaves.",
      objective: "Burn the home down so the road is the only option.",
      pov: "Kael",
      status: "outline",
      notes: "",
      order: 0,
      words: 52,
      updatedAt: now,
    },
  ];

  const flows: Flow[] = [
    {
      id: "fl_1",
      name: "Main story spine",
      template: "story",
      description: "The whole arc at one altitude.",
      scope: "Entire Story",
      direction: "Linear",
      goal: "Keep the middle from sagging.",
      nodes: [
        { id: "n1", type: "beat", position: { x: 0, y: 140 }, data: { label: "Birthplace", note: "Aetherfall Haven" } },
        { id: "n2", type: "beat", position: { x: 240, y: 140 }, data: { label: "Inciting Incident", note: "The Order arrives" } },
        { id: "n3", type: "beat", position: { x: 480, y: 140 }, data: { label: "Departure" } },
        { id: "n4", type: "beat", position: { x: 720, y: 140 }, data: { label: "Conflict" } },
        { id: "n5", type: "beat", position: { x: 960, y: 140 }, data: { label: "Return" } },
        { id: "n6", type: "beat", position: { x: 1200, y: 140 }, data: { label: "Final Choice", accent: "#1bb4f0" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n4" },
        { id: "e4", source: "n4", target: "n5" },
        { id: "e5", source: "n5", target: "n6" },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { boards, entities, volumes, chapters, scenes, flows };
}
