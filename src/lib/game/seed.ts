import type { GameNarrative } from "./types";

/**
 * A small but complete sample narrative, deliberately exercising every part of
 * the runtime: a gated choice, a branch, quest transitions, a relationship
 * change, a faction hit, a world event, and two distinct endings.
 *
 * Entity ids match the Phase 1 seed (Aetherfall Haven), so the World Matrix
 * and the Game Studio describe the same world.
 */
export function buildGameSeed(): GameNarrative {
  return {
    entryDialogueId: "CONV_001",

    variables: [
      {
        id: "VAR_001",
        name: "player.has_key",
        type: "boolean",
        initial: false,
        description: "Carries the Haven gate key.",
      },
      {
        id: "VAR_002",
        name: "village.reputation",
        type: "integer",
        initial: 45,
        description: "How the Haven feels about the player.",
      },
      {
        id: "VAR_003",
        name: "quest.crown",
        type: "enum",
        initial: "inactive",
        options: ["inactive", "active", "completed", "failed"],
        description: "Shorthand state for the crown storyline.",
      },
      {
        id: "VAR_004",
        name: "player.gold",
        type: "integer",
        initial: 120,
        description: "Coin on hand.",
      },
      {
        id: "VAR_005",
        name: "elder.told_truth",
        type: "boolean",
        initial: false,
        description: "Whether Sora admitted what she knows.",
      },
    ],

    factions: [
      {
        id: "FAC_001",
        name: "Ashen Order",
        description: "Kept the Gate closed. Fewer of them every year.",
        initialReputation: -10,
        entityId: "en_order",
      },
      {
        id: "FAC_002",
        name: "Haven Guard",
        description: "What passes for a militia in a village of 300.",
        initialReputation: 20,
        entityId: null,
      },
    ],

    relationships: [
      { id: "REL_001", characterId: "en_elder", axis: "trust", initial: 40 },
      { id: "REL_002", characterId: "en_rival", axis: "friendship", initial: 60 },
    ],

    quests: [
      {
        id: "QUEST_001",
        name: "What the Gate Keeps Out",
        description:
          "Sora knows why the Order came. Getting it out of her is the quest.",
        giverId: "en_elder",
        locationId: "en_haven",
        prerequisites: [],
        objectives: [
          {
            id: "OBJ_001",
            kind: "talk",
            description: "Ask Sora about the Order",
            target: "en_elder",
            optional: false,
            hidden: false,
            completeWhen: [
              {
                id: "C_OBJ1",
                kind: "compare",
                varName: "elder.told_truth",
                op: "==",
                value: true,
              },
            ],
          },
          {
            id: "OBJ_002",
            kind: "find",
            description: "Take the gate key",
            target: "en_gate",
            optional: true,
            hidden: false,
            completeWhen: [
              {
                id: "C_OBJ2",
                kind: "compare",
                varName: "player.has_key",
                op: "==",
                value: true,
              },
            ],
          },
        ],
        rewards: [
          { id: "E_R1", kind: "add", target: "village.reputation", value: 10 },
        ],
        onFail: [
          { id: "E_F1", kind: "sub", target: "village.reputation", value: 15 },
        ],
        failWhen: [],
        unlocks: ["QUEST_002"],
        dialogueId: "CONV_001",
        initialState: "available",
      },
      {
        id: "QUEST_002",
        name: "The Road Out",
        description: "Unlocked once Sora talks. Leaving is its own problem.",
        giverId: "en_rival",
        locationId: "en_haven",
        prerequisites: [
          {
            id: "C_Q2",
            kind: "compare",
            varName: "elder.told_truth",
            op: "==",
            value: true,
          },
        ],
        objectives: [
          {
            id: "OBJ_003",
            kind: "reach",
            description: "Reach the Drowned Gate",
            target: "en_gate",
            optional: false,
            hidden: false,
            completeWhen: [],
          },
        ],
        rewards: [],
        onFail: [],
        failWhen: [],
        unlocks: [],
        dialogueId: null,
        initialState: "unavailable",
      },
    ],

    events: [
      {
        id: "EVT_001",
        name: "The Haven turns cold",
        description:
          "Push the village far enough and the doors stop opening for you.",
        conditions: [
          {
            id: "C_EV1",
            kind: "compare",
            varName: "village.reputation",
            op: "<",
            value: 30,
          },
        ],
        effects: [
          { id: "E_EV1", kind: "faction", target: "FAC_002", value: -25 },
        ],
        once: true,
      },
    ],

    dialogues: [
      {
        id: "CONV_001",
        name: "Sora at the rail",
        description: "The opening conversation. Branches on whether you push.",
        entryNodeId: "DLG_001",
        layout: {
          DLG_001: { x: 0, y: 0 },
          DLG_002: { x: 300, y: -120 },
          DLG_003: { x: 300, y: 60 },
          DLG_004: { x: 600, y: -120 },
          DLG_005: { x: 600, y: 120 },
          DLG_006: { x: 900, y: 0 },
        },
        nodes: [
          {
            id: "DLG_001",
            speakerId: "en_elder",
            text: "You're standing where your mother used to stand. She didn't like the answer either.",
            emotion: "neutral",
            locationId: "en_haven",
            camera: "Medium two-shot",
            voiceLineId: "VO_001",
            conditions: [],
            effects: [
              { id: "E_1", kind: "quest", target: "QUEST_001", value: "active" },
              { id: "E_2", kind: "set", target: "quest.crown", value: "active" },
            ],
            choices: [
              {
                id: "CHOICE_001",
                text: "What answer?",
                conditions: [],
                effects: [],
                next: "DLG_002",
              },
              {
                id: "CHOICE_002",
                text: "The grey riders. Who are they?",
                conditions: [],
                effects: [
                  { id: "E_3", kind: "faction", target: "FAC_001", value: -5 },
                ],
                next: "DLG_003",
              },
              {
                id: "CHOICE_003",
                text: "[Show the key] I already found this.",
                conditions: [
                  {
                    id: "C_1",
                    kind: "compare",
                    varName: "player.has_key",
                    op: "==",
                    value: true,
                  },
                ],
                effects: [],
                next: "DLG_004",
                showLocked: true,
                lockedHint: "You'd need the gate key first",
              },
            ],
            next: "",
          },
          {
            id: "DLG_002",
            speakerId: "en_elder",
            text: "That the Haven was never hidden. It was allowed. There's a difference, and you're old enough to hear it.",
            emotion: "sad",
            locationId: "en_haven",
            conditions: [],
            effects: [
              { id: "E_4", kind: "set", target: "elder.told_truth", value: true },
              { id: "E_5", kind: "relationship", target: "en_elder", value: 10 },
            ],
            choices: [
              {
                id: "CHOICE_004",
                text: "Allowed by whom?",
                conditions: [],
                effects: [],
                next: "DLG_004",
              },
              {
                id: "CHOICE_005",
                text: "Then I'm done being allowed.",
                conditions: [],
                effects: [
                  { id: "E_6", kind: "sub", target: "village.reputation", value: 20 },
                ],
                next: "DLG_005",
              },
            ],
            next: "",
          },
          {
            id: "DLG_003",
            speakerId: "en_elder",
            text: "Don't say their name inside the wall. They came for the Gate, not for you. Be grateful that's still true.",
            emotion: "afraid",
            locationId: "en_haven",
            conditions: [],
            effects: [],
            choices: [
              {
                id: "CHOICE_006",
                text: "Tell me the rest.",
                conditions: [],
                effects: [],
                next: "DLG_002",
              },
              {
                id: "CHOICE_007",
                text: "Then I'll ask them myself.",
                conditions: [],
                effects: [
                  { id: "E_7", kind: "sub", target: "village.reputation", value: 25 },
                  { id: "E_8", kind: "relationship", target: "en_elder", value: -15 },
                ],
                next: "DLG_005",
              },
            ],
            next: "",
          },
          {
            id: "DLG_004",
            speakerId: "en_elder",
            text: "By whatever the Order answers to. Take the key. Take the road. Don't take the Gate — not yet.",
            emotion: "determined",
            locationId: "en_haven",
            conditions: [],
            effects: [
              { id: "E_9", kind: "set", target: "player.has_key", value: true },
              { id: "E_10", kind: "quest", target: "QUEST_001", value: "completed" },
              { id: "E_11", kind: "add", target: "village.reputation", value: 10 },
              { id: "E_12", kind: "quest", target: "QUEST_002", value: "available" },
            ],
            choices: [],
            next: "DLG_006",
          },
          {
            id: "DLG_005",
            speakerId: "en_elder",
            text: "Then go. But you'll go without the key, and without me telling anyone which way you went.",
            emotion: "angry",
            locationId: "en_haven",
            conditions: [],
            effects: [
              { id: "E_13", kind: "quest", target: "QUEST_001", value: "failed" },
              { id: "E_14", kind: "set", target: "quest.crown", value: "failed" },
            ],
            choices: [],
            next: "",
            isEnding: true,
            endingLabel: "Ending B — Left on bad terms",
          },
          {
            id: "DLG_006",
            speakerId: null,
            text: "She put the key in your hand and closed your fingers over it, the way you close a wound.",
            emotion: "neutral",
            locationId: "en_haven",
            conditions: [],
            effects: [],
            choices: [],
            next: "",
            isEnding: true,
            endingLabel: "Ending A — Left with the key",
          },
        ],
      },
    ],
  };
}
