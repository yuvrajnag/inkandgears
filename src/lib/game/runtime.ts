import {
  applyEffects,
  evalAll,
  initialScope,
  type EffectOutcome,
  type EvalScope,
} from "./logic";
import type {
  Dialogue,
  DialogueChoice,
  DialogueNode,
  GameNarrative,
  HistoryEntry,
  PlaytestSession,
  QuestState,
} from "./types";

/**
 * The narrative runtime.
 *
 * Deterministic by construction: the same starting state plus the same
 * sequence of choices always produces the same session. Nothing in here reads
 * or writes project data — a session carries its own copy of every value, so
 * playing a narrative can never modify the source (Phase 2 rule 53).
 */

export type PresentedChoice = {
  choice: DialogueChoice;
  enabled: boolean;
  /** Set when the choice is visible but blocked. */
  reason?: string;
};

export type Frame = {
  node: DialogueNode | null;
  choices: PresentedChoice[];
  finished: boolean;
  endingLabel: string | null;
};

function stamp(): number {
  return Date.now();
}

export function startSession(
  narrative: GameNarrative,
  opts: { dialogueId?: string; nodeId?: string } = {},
): PlaytestSession {
  const dialogueId = opts.dialogueId ?? narrative.entryDialogueId;
  const dialogue = narrative.dialogues.find((d) => d.id === dialogueId);
  const questStates: Record<string, QuestState> = {};
  for (const q of narrative.quests) questStates[q.id] = q.initialState;

  const session: PlaytestSession = {
    id: `SESSION_${stamp()}`,
    startedAt: stamp(),
    vars: initialScope(
      narrative.variables,
      narrative.relationships,
      narrative.factions,
    ),
    questStates,
    firedEvents: [],
    currentDialogueId: dialogue?.id ?? null,
    currentNodeId: opts.nodeId ?? dialogue?.entryNodeId ?? null,
    visitedNodes: [],
    takenChoices: [],
    history: [],
    finished: !dialogue,
    endingLabel: null,
  };

  return session.currentNodeId
    ? enterNode(narrative, session, session.currentNodeId)
    : session;
}

function findNode(
  narrative: GameNarrative,
  dialogueId: string | null,
  nodeId: string,
): { dialogue: Dialogue; node: DialogueNode } | null {
  // Prefer the current conversation, then fall back to a global lookup so a
  // choice can jump into another dialogue.
  const ordered = [
    ...narrative.dialogues.filter((d) => d.id === dialogueId),
    ...narrative.dialogues.filter((d) => d.id !== dialogueId),
  ];
  for (const d of ordered) {
    const node = d.nodes.find((n) => n.id === nodeId);
    if (node) return { dialogue: d, node };
  }
  return null;
}

/** Fires any world event whose conditions now hold. */
function runEvents(
  narrative: GameNarrative,
  outcome: EffectOutcome,
  history: HistoryEntry[],
): EffectOutcome {
  let acc = outcome;
  // A single pass is enough for the common case; loop a bounded number of
  // times so an event that unlocks another event still resolves, without
  // risking an infinite cascade.
  for (let pass = 0; pass < 4; pass++) {
    let firedThisPass = false;
    for (const ev of narrative.events) {
      if (ev.once && acc.firedEvents.includes(ev.id)) continue;
      if (ev.conditions.length === 0) continue;
      if (!evalAll(ev.conditions, acc.scope)) continue;
      if (acc.firedEvents.includes(ev.id) && ev.once) continue;

      acc = applyEffects(ev.effects, {
        ...acc,
        firedEvents: acc.firedEvents.includes(ev.id)
          ? acc.firedEvents
          : [...acc.firedEvents, ev.id],
      });
      history.push({
        kind: "event",
        eventId: ev.id,
        name: ev.name,
        at: stamp(),
      });
      firedThisPass = true;
    }
    if (!firedThisPass) break;
  }
  return acc;
}

/**
 * Walks into a node: applies its effects, records history, and skips it when
 * its own conditions fail.
 */
export function enterNode(
  narrative: GameNarrative,
  session: PlaytestSession,
  nodeId: string,
  guard = 0,
): PlaytestSession {
  if (guard > 64) {
    // Runaway chain — stop rather than hang the editor.
    return {
      ...session,
      finished: true,
      endingLabel: "Stopped: node chain ran too deep (possible loop)",
    };
  }

  const found = findNode(narrative, session.currentDialogueId, nodeId);
  if (!found) {
    return {
      ...session,
      finished: true,
      endingLabel: `Stopped: node ${nodeId} does not exist`,
    };
  }
  const { dialogue, node } = found;
  const history = [...session.history];

  // A node whose conditions fail is skipped straight to its fallback.
  if (node.conditions.length > 0 && !evalAll(node.conditions, session.vars)) {
    if (!node.next) {
      return { ...session, finished: true, endingLabel: node.endingLabel ?? null };
    }
    return enterNode(
      narrative,
      { ...session, currentDialogueId: dialogue.id },
      node.next,
      guard + 1,
    );
  }

  let outcome: EffectOutcome = {
    scope: { ...session.vars },
    questStates: { ...session.questStates },
    log: [],
    firedEvents: [...session.firedEvents],
  };

  history.push({
    kind: "node",
    nodeId: node.id,
    speaker: node.speakerId ?? "",
    text: node.text,
    at: stamp(),
  });

  if (node.effects.length) {
    const before = outcome.questStates;
    outcome = applyEffects(node.effects, outcome);
    outcome.log.forEach((describe) =>
      history.push({ kind: "effect", describe, at: stamp() }),
    );
    outcome = { ...outcome, log: [] };
    for (const [qid, st] of Object.entries(outcome.questStates)) {
      if (before[qid] !== st) {
        history.push({ kind: "quest", questId: qid, state: st, at: stamp() });
      }
    }
  }

  outcome = runEvents(narrative, outcome, history);

  const next: PlaytestSession = {
    ...session,
    currentDialogueId: dialogue.id,
    currentNodeId: node.id,
    vars: outcome.scope,
    questStates: outcome.questStates,
    firedEvents: outcome.firedEvents,
    visitedNodes: session.visitedNodes.includes(node.id)
      ? session.visitedNodes
      : [...session.visitedNodes, node.id],
    history,
    finished: false,
    endingLabel: null,
  };

  // No choices and no next link means this is a terminal node.
  const usable = visibleChoices(node, next);
  if (usable.length === 0 && !node.next) {
    const label = node.endingLabel ?? (node.isEnding ? node.text : "End");
    history.push({ kind: "end", label, at: stamp() });
    return { ...next, finished: true, endingLabel: label, history };
  }

  // No choices but a next link: fall through automatically.
  if (usable.length === 0 && node.next) {
    return enterNode(narrative, next, node.next, guard + 1);
  }

  return next;
}

function visibleChoices(
  node: DialogueNode,
  session: PlaytestSession,
): PresentedChoice[] {
  const out: PresentedChoice[] = [];
  for (const choice of node.choices) {
    if (choice.once && session.takenChoices.includes(choice.id)) continue;
    const pass =
      choice.conditions.length === 0 || evalAll(choice.conditions, session.vars);
    if (pass) {
      out.push({ choice, enabled: true });
    } else if (choice.showLocked) {
      out.push({
        choice,
        enabled: false,
        reason: choice.lockedHint || "Requirements not met",
      });
    }
  }
  return out;
}

export function currentFrame(
  narrative: GameNarrative,
  session: PlaytestSession,
): Frame {
  if (session.finished || !session.currentNodeId) {
    return {
      node: null,
      choices: [],
      finished: true,
      endingLabel: session.endingLabel,
    };
  }
  const found = findNode(
    narrative,
    session.currentDialogueId,
    session.currentNodeId,
  );
  if (!found) {
    return { node: null, choices: [], finished: true, endingLabel: null };
  }
  return {
    node: found.node,
    choices: visibleChoices(found.node, session),
    finished: false,
    endingLabel: null,
  };
}

export function choose(
  narrative: GameNarrative,
  session: PlaytestSession,
  choiceId: string,
): PlaytestSession {
  const frame = currentFrame(narrative, session);
  const picked = frame.choices.find(
    (c) => c.choice.id === choiceId && c.enabled,
  );
  if (!picked || !frame.node) return session;

  const choice = picked.choice;
  const history: HistoryEntry[] = [
    ...session.history,
    { kind: "choice", choiceId: choice.id, text: choice.text, at: stamp() },
  ];

  let outcome: EffectOutcome = {
    scope: { ...session.vars },
    questStates: { ...session.questStates },
    log: [],
    firedEvents: [...session.firedEvents],
  };

  if (choice.effects.length) {
    const before = outcome.questStates;
    outcome = applyEffects(choice.effects, outcome);
    outcome.log.forEach((describe) =>
      history.push({ kind: "effect", describe, at: stamp() }),
    );
    outcome = { ...outcome, log: [] };
    for (const [qid, st] of Object.entries(outcome.questStates)) {
      if (before[qid] !== st) {
        history.push({ kind: "quest", questId: qid, state: st, at: stamp() });
      }
    }
  }

  outcome = runEvents(narrative, outcome, history);

  const moved: PlaytestSession = {
    ...session,
    vars: outcome.scope,
    questStates: outcome.questStates,
    firedEvents: outcome.firedEvents,
    takenChoices: [...session.takenChoices, choice.id],
    history,
  };

  if (!choice.next) {
    const label = "End";
    return {
      ...moved,
      finished: true,
      endingLabel: label,
      history: [...history, { kind: "end", label, at: stamp() }],
    };
  }

  return enterNode(narrative, moved, choice.next);
}

/** Manual variable override from the debug panel. */
export function setVar(
  session: PlaytestSession,
  name: string,
  value: PlaytestSession["vars"][string],
): PlaytestSession {
  return { ...session, vars: { ...session.vars, [name]: value } };
}

export function scopeOf(session: PlaytestSession): EvalScope {
  return session.vars;
}
