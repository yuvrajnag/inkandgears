/**
 * Phase 2 — Game Narrative Studio.
 *
 * Everything here carries a stable, human-readable id (QUEST_001, DLG_047,
 * VAR_021). Exports and engine integration depend on those ids never moving,
 * so they are assigned once at creation and never regenerated.
 */

export type VarType =
  | "boolean"
  | "integer"
  | "float"
  | "string"
  | "enum"
  | "counter";

export type VarValue = boolean | number | string;

export type Variable = {
  id: string; // VAR_001
  name: string; // player.has_key
  type: VarType;
  initial: VarValue;
  /** enum only */
  options?: string[];
  description: string;
};

/* ------------------------------ conditions ----------------------------- */

export type CompareOp =
  | "=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<="
  | "contains"
  | "!contains";

/** A single comparison against a variable. */
export type Comparison = {
  id: string;
  kind: "compare";
  varName: string;
  op: CompareOp;
  value: VarValue;
};

/** AND / OR / NOT over child conditions — nesting is allowed. */
export type ConditionGroup = {
  id: string;
  kind: "all" | "any" | "none";
  children: Condition[];
};

export type Condition = Comparison | ConditionGroup;

/* -------------------------------- effects ------------------------------ */

export type EffectKind =
  | "set" // var = value
  | "add" // var += value
  | "sub" // var -= value
  | "quest" // quest state transition
  | "event" // fire a world event
  | "relationship" // character relationship delta
  | "faction"; // faction reputation delta

export type Effect = {
  id: string;
  kind: EffectKind;
  /** variable name, quest id, event id, character id, or faction id */
  target: string;
  value: VarValue;
};

/* ------------------------------- dialogue ------------------------------ */

export type Emotion =
  | "neutral"
  | "happy"
  | "angry"
  | "sad"
  | "afraid"
  | "surprised"
  | "determined";

export type DialogueChoice = {
  id: string; // CHOICE_001
  text: string;
  /** Hidden entirely when these fail. */
  conditions: Condition[];
  effects: Effect[];
  /** Target node id. Empty means the conversation ends here. */
  next: string;
  /** Show greyed-out with a reason rather than hiding it. */
  showLocked?: boolean;
  lockedHint?: string;
  once?: boolean;
};

export type DialogueNode = {
  id: string; // DLG_001
  /** World Matrix entity id of the speaker. */
  speakerId: string | null;
  text: string;
  emotion: Emotion;
  /** Optional presentation metadata for engine implementation. */
  camera?: string;
  animation?: string;
  sfx?: string;
  voiceLineId?: string; // VO_001
  locationId?: string | null;
  /** Node is skipped when these fail. */
  conditions: Condition[];
  /** Applied on entering the node. */
  effects: Effect[];
  choices: DialogueChoice[];
  /** Used when there are no choices. Empty means this node is an ending. */
  next: string;
  isEnding?: boolean;
  endingLabel?: string;
};

export type Dialogue = {
  id: string; // CONV_001
  name: string;
  description: string;
  entryNodeId: string;
  nodes: DialogueNode[];
  /** Optional layout for the graph view. */
  layout: Record<string, { x: number; y: number }>;
};

/* --------------------------------- quests ------------------------------ */

export type ObjectiveKind =
  | "talk"
  | "reach"
  | "find"
  | "collect"
  | "defeat"
  | "escort"
  | "protect"
  | "investigate"
  | "choose"
  | "trigger"
  | "wait"
  | "quest";

export type QuestObjective = {
  id: string; // OBJ_001
  kind: ObjectiveKind;
  description: string;
  /** entity id, quest id, or variable name depending on kind */
  target: string;
  optional: boolean;
  hidden: boolean;
  /** Marks the objective done. */
  completeWhen: Condition[];
};

export type QuestState =
  | "unavailable"
  | "available"
  | "active"
  | "completed"
  | "failed";

export type Quest = {
  id: string; // QUEST_001
  name: string;
  description: string;
  giverId: string | null;
  locationId: string | null;
  /** Quest only becomes available when these pass. */
  prerequisites: Condition[];
  objectives: QuestObjective[];
  /** Applied on completion. */
  rewards: Effect[];
  /** Applied on failure. */
  onFail: Effect[];
  failWhen: Condition[];
  /** Quests unlocked by completing this one. */
  unlocks: string[];
  dialogueId: string | null;
  initialState: QuestState;
};

/* --------------------------------- world ------------------------------- */

export type WorldEvent = {
  id: string; // EVT_001
  name: string;
  description: string;
  /** Fires automatically when these pass (checked after every state change). */
  conditions: Condition[];
  effects: Effect[];
  once: boolean;
};

export type RelationshipAxis =
  | "trust"
  | "friendship"
  | "romance"
  | "respect"
  | "fear"
  | "loyalty"
  | "rivalry"
  | "hostility";

export type CharacterRelationship = {
  id: string;
  characterId: string;
  axis: RelationshipAxis;
  initial: number;
};

export type Faction = {
  id: string; // FAC_001
  name: string;
  description: string;
  initialReputation: number;
  /** World Matrix entity this mirrors, when there is one. */
  entityId: string | null;
};

/* ------------------------------- narrative ----------------------------- */

export type GameNarrative = {
  variables: Variable[];
  dialogues: Dialogue[];
  quests: Quest[];
  events: WorldEvent[];
  factions: Faction[];
  relationships: CharacterRelationship[];
  /** Dialogue id the simulator starts from. */
  entryDialogueId: string | null;
};

/* -------------------------------- runtime ------------------------------ */

export type HistoryEntry =
  | { kind: "node"; nodeId: string; speaker: string; text: string; at: number }
  | { kind: "choice"; choiceId: string; text: string; at: number }
  | { kind: "effect"; describe: string; at: number }
  | { kind: "quest"; questId: string; state: QuestState; at: number }
  | { kind: "event"; eventId: string; name: string; at: number }
  | { kind: "end"; label: string; at: number };

/**
 * A playtest session. Deliberately separate from the project so that playing a
 * narrative can never write back into the creator's source data.
 */
export type PlaytestSession = {
  id: string;
  startedAt: number;
  /** Live variable values, keyed by variable NAME (what conditions reference). */
  vars: Record<string, VarValue>;
  questStates: Record<string, QuestState>;
  firedEvents: string[];
  currentDialogueId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];
  takenChoices: string[];
  history: HistoryEntry[];
  finished: boolean;
  endingLabel: string | null;
};

/* ------------------------------ validation ----------------------------- */

export type IssueLevel = "error" | "warning" | "info";

export type ValidationIssue = {
  level: IssueLevel;
  code:
    | "unreachable-node"
    | "dead-end"
    | "missing-variable"
    | "broken-reference"
    | "impossible-branch"
    | "circular-flow"
    | "missing-ending"
    | "unused-content"
    | "duplicate-id"
    | "no-entry";
  message: string;
  /** Where to jump when the issue is clicked. */
  dialogueId?: string;
  nodeId?: string;
  questId?: string;
};

export type ValidationReport = {
  ranAt: number;
  nodesChecked: number;
  conditionsChecked: number;
  questsChecked: number;
  issues: ValidationIssue[];
  coverage: {
    reachableNodes: number;
    totalNodes: number;
    usedCharacters: number;
    totalCharacters: number;
    usedLocations: number;
    totalLocations: number;
  };
};
