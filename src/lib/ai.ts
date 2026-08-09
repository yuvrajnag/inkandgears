import { docToText } from "./store";
import type { Chapter, Entity, Flow, Scene } from "./types";
import { describeCondition, describeEffect } from "./game/logic";
import type { GameNarrative, ValidationReport } from "./game/types";

export type CommandAction = {
  id: string;
  label: string;
  group: "write" | "develop" | "analyse" | "world" | "game";
  hint: string;
};

export const COMMAND_ACTIONS: CommandAction[] = [
  {
    id: "continue",
    label: "Continue",
    group: "write",
    hint: "Drafts the next few lines in the voice of the current scene. Review before you keep any of it.",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    group: "write",
    hint: "Offers an alternative pass over the scene. Your original stays untouched until you accept.",
  },
  {
    id: "expand",
    label: "Expand",
    group: "write",
    hint: "Adds texture — sensory detail, beats between dialogue — without changing what happens.",
  },
  {
    id: "condense",
    label: "Condense",
    group: "write",
    hint: "Tightens the scene while keeping every plot beat intact.",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    group: "develop",
    hint: "Throws options at the wall for where this could go next.",
  },
  {
    id: "conflict",
    label: "Conflict",
    group: "develop",
    hint: "Suggests pressure to apply, given who is in the scene and what they want.",
  },
  {
    id: "continuity",
    label: "Continuity",
    group: "analyse",
    hint: "Reads the scene against your World Matrix and flags things that don't line up.",
  },
  {
    id: "pacing",
    label: "Pacing",
    group: "analyse",
    hint: "Looks at scene and chapter length, dialogue density, and where the story slows down.",
  },
  {
    id: "lore",
    label: "Lore",
    group: "world",
    hint: "Grows detail for the entities this scene already references.",
  },
  {
    id: "quest-ideas",
    label: "Quest ideas",
    group: "game",
    hint: "Proposes quests that use the characters, places and variables you already have.",
  },
  {
    id: "branch-check",
    label: "Branch check",
    group: "game",
    hint: "Reads the dialogue graph for thin branching, unused state and choices that don't matter.",
  },
  {
    id: "consequences",
    label: "Consequences",
    group: "game",
    hint: "Suggests effects for choices that currently change nothing.",
  },
];

export type AiContext = {
  projectName?: string;
  sceneTitle: string;
  chapterTitle: string;
  sceneObjective: string;
  scenePov: string;
  text: string;
  entities: {
    name: string;
    kind: string;
    description: string;
    details: string[];
  }[];
  flows: { name: string; beats: string[] }[];
  stats: { words: number; scenes: number; chapters: number };
  /** Phase 2 — present only when the game narrative has content. */
  game?: {
    quests: { id: string; name: string; objectives: string[]; state: string }[];
    variables: { name: string; type: string; initial: string }[];
    dialogue: {
      id: string;
      name: string;
      nodes: number;
      endings: string[];
      /** Choices that carry no effects — the flat spots. */
      inertChoices: string[];
    }[];
    events: { name: string; when: string; then: string[] }[];
    issues: string[];
  };
};

/**
 * Context assembly.
 *
 * Deliberately narrow: the current scene, its chapter, the entities that scene
 * actually references, and a thin project summary. The whole project is never
 * shipped off — that is what makes this cheap and keeps it on-topic.
 */
export function buildContext(input: {
  scene: Scene | null;
  chapters: Chapter[];
  scenes: Scene[];
  entities: Entity[];
  flows: Flow[];
  appearancesFor: (entityId: string, scenes: Scene[]) => Scene[];
  narrative?: GameNarrative;
  report?: ValidationReport;
}): AiContext {
  const { scene, chapters, scenes, entities, flows, narrative, report } = input;
  const chapter = chapters.find((c) => c.id === scene?.chapterId);
  const text = scene ? docToText(scene.doc).trim() : "";

  const linked = scene
    ? entities.filter((e) => JSON.stringify(scene.doc).includes(`"${e.id}"`))
    : [];

  return {
    sceneTitle: scene?.title ?? "",
    chapterTitle: chapter?.title ?? "",
    sceneObjective: scene?.objective ?? "",
    scenePov: scene?.pov ?? "",
    text: text.slice(0, 6000),
    entities: linked.slice(0, 12).map((e) => ({
      name: e.name,
      kind: e.kind,
      description: e.description.slice(0, 400),
      details: e.details
        .filter((d) => d.type !== "color")
        .map((d) => (d.label ? `${d.label}: ${d.value}` : d.value)),
    })),
    flows: flows.slice(0, 3).map((f) => ({
      name: f.name,
      beats: f.nodes.map((n) => n.data.label).slice(0, 20),
    })),
    stats: {
      words: scenes.reduce((n, s) => n + s.words, 0),
      scenes: scenes.length,
      chapters: chapters.length,
    },
    game: narrative ? summariseNarrative(narrative, report) : undefined,
  };
}

/**
 * A compact view of the game narrative. Deliberately structural rather than
 * verbatim — the assistant needs the shape of the branching and the state, not
 * every line of dialogue.
 */
function summariseNarrative(n: GameNarrative, report?: ValidationReport) {
  return {
    quests: n.quests.slice(0, 20).map((q) => ({
      id: q.id,
      name: q.name,
      objectives: q.objectives.map((o) => o.description),
      state: q.initialState,
    })),
    variables: n.variables.slice(0, 40).map((v) => ({
      name: v.name,
      type: v.type,
      initial: String(v.initial),
    })),
    dialogue: n.dialogues.slice(0, 10).map((d) => ({
      id: d.id,
      name: d.name,
      nodes: d.nodes.length,
      endings: d.nodes
        .filter((x) => x.isEnding)
        .map((x) => x.endingLabel ?? x.id),
      inertChoices: d.nodes
        .flatMap((x) => x.choices)
        .filter((c) => c.effects.length === 0)
        .map((c) => c.text)
        .slice(0, 12),
    })),
    events: n.events.slice(0, 12).map((e) => ({
      name: e.name,
      when: e.conditions.map((c) => describeCondition(c)).join(" AND "),
      then: e.effects.map((x) => describeEffect(x)),
    })),
    issues: (report?.issues ?? []).slice(0, 12).map((i) => i.message),
  };
}

export function systemPrompt(): string {
  return [
    "You are Commands, the writing assistant inside a narrative creation platform.",
    "You assist the author; you never take over. Match the voice already on the page.",
    "Be concrete and specific to the material you are given. No filler, no preamble,",
    "no restating the request. If you are asked to analyse, give findings, not praise.",
    "Never claim certainty about how readers will react.",
    "Return plain prose or a short list. No markdown headings.",
  ].join(" ");
}

export function userPrompt(action: string, prompt: string, ctx: AiContext) {
  const parts: string[] = [];
  parts.push(`Task: ${action}`);
  if (prompt.trim()) parts.push(`Author's note: ${prompt.trim()}`);
  if (ctx.chapterTitle || ctx.sceneTitle) {
    parts.push(`Scene: ${ctx.chapterTitle} / ${ctx.sceneTitle}`);
  }
  if (ctx.scenePov) parts.push(`POV: ${ctx.scenePov}`);
  if (ctx.sceneObjective) parts.push(`Scene objective: ${ctx.sceneObjective}`);
  if (ctx.entities.length) {
    parts.push(
      "Entities referenced in this scene:\n" +
        ctx.entities
          .map(
            (e) =>
              `- ${e.name} (${e.kind}): ${e.description}${
                e.details.length ? ` [${e.details.join("; ")}]` : ""
              }`,
          )
          .join("\n"),
    );
  }
  if (ctx.flows.length) {
    parts.push(
      "Planned structure:\n" +
        ctx.flows.map((f) => `- ${f.name}: ${f.beats.join(" → ")}`).join("\n"),
    );
  }
  if (ctx.game) {
    const g = ctx.game;
    if (g.quests.length) {
      parts.push(
        "Quests:\n" +
          g.quests
            .map(
              (q) =>
                `- ${q.id} ${q.name} [${q.state}]${q.objectives.length ? `: ${q.objectives.join("; ")}` : ""}`,
            )
            .join("\n"),
      );
    }
    if (g.variables.length) {
      parts.push(
        "Narrative state:\n" +
          g.variables.map((v) => `- ${v.name} (${v.type}) = ${v.initial}`).join("\n"),
      );
    }
    if (g.dialogue.length) {
      parts.push(
        "Conversations:\n" +
          g.dialogue
            .map(
              (d) =>
                `- ${d.name}: ${d.nodes} nodes, endings [${d.endings.join(", ") || "none"}]` +
                (d.inertChoices.length
                  ? `; choices with no effect: ${d.inertChoices.join(" | ")}`
                  : ""),
            )
            .join("\n"),
      );
    }
    if (g.events.length) {
      parts.push(
        "World events:\n" +
          g.events.map((e) => `- ${e.name}: WHEN ${e.when} THEN ${e.then.join(", ")}`).join("\n"),
      );
    }
    if (g.issues.length) {
      parts.push("Debugger is currently reporting:\n" + g.issues.map((i) => `- ${i}`).join("\n"));
    }
  }
  if (ctx.text) parts.push(`Scene text:\n"""\n${ctx.text}\n"""`);
  return parts.join("\n\n");
}

/**
 * Offline fallback.
 *
 * With no model configured this still has to be useful, so it does the parts
 * that are genuinely deterministic: measuring the scene, cross-checking it
 * against the World Matrix, and asking the questions a script editor would.
 */
export function localResponse(
  actionId: string,
  prompt: string,
  ctx: AiContext,
): string {
  const words = ctx.text ? ctx.text.trim().split(/\s+/).length : 0;
  const sentences = ctx.text.split(/[.!?]+\s/).filter(Boolean);
  const avgSentence = sentences.length ? Math.round(words / sentences.length) : 0;
  const dialogueLines = (ctx.text.match(/[“"]/g)?.length ?? 0) / 2;
  const names = ctx.entities.map((e) => e.name);

  const head = (s: string) => `${s}\n`;

  switch (actionId) {
    case "pacing":
      return head("Pacing read") +
        [
          `${words} words across ${sentences.length} sentences (avg ${avgSentence} words per sentence).`,
          `Roughly ${Math.round(dialogueLines)} lines of dialogue.`,
          avgSentence > 26
            ? "Sentences run long. In a scene meant to move, break the longest ones in half."
            : avgSentence < 9 && words > 120
              ? "Very short sentences throughout — deliberate staccato, or is the scene rushing?"
              : "Sentence length is in a comfortable range for prose.",
          words < 250
            ? "This is short for a full scene. Either it is a beat rather than a scene, or something is missing between the opening and the turn."
            : words > 2200
              ? "Long enough that it probably contains two scenes. Look for the point where the goal changes."
              : "Length is reasonable for a single scene.",
          dialogueLines === 0 && words > 200
            ? "No dialogue at all. If more than one character is present, the scene is being summarised rather than played."
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");

    case "continuity":
      return head("Continuity check") +
        [
          names.length
            ? `Linked to: ${names.join(", ")}.`
            : "Nothing in this scene is linked to the World Matrix yet. Use /c and /p while you write so appearances build themselves.",
          ...ctx.entities
            .filter((e) => !e.description.trim())
            .map(
              (e) =>
                `${e.name} has no description on its entity page, so nothing here can be checked against it.`,
            ),
          ...ctx.entities
            .filter((e) => e.details.length === 0)
            .map((e) => `${e.name} has no details recorded — no facts to contradict yet.`),
          ctx.sceneObjective
            ? `Stated objective: "${ctx.sceneObjective}". Does the scene end having achieved, failed, or complicated it?`
            : "No scene objective set. Without one there is no way to tell whether this scene earns its place.",
          ctx.scenePov
            ? `POV is ${ctx.scenePov}. Check for anything on the page they could not see, hear, or know.`
            : "No POV set for this scene.",
        ]
          .filter(Boolean)
          .join("\n\n");

    case "brainstorm":
      return head("Directions from here") +
        [
          names[0]
            ? `Give ${names[0]} something to lose in the next scene, then take it in the one after.`
            : "Put a name to the person this scene is happening to — the stakes follow from that.",
          names[1]
            ? `Let ${names[1]} want the same thing as ${names[0] ?? "the POV character"}, for a reason nobody can argue with.`
            : "Introduce someone whose goal is reasonable and incompatible.",
          "Answer a question the reader has been carrying, and open a larger one in the same paragraph.",
          "Cut the scene one beat earlier than feels comfortable and see whether anything is actually lost.",
          prompt.trim() ? `On your note — "${prompt.trim()}" — try it as the scene's opening line rather than its resolution.` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

    case "conflict":
      return head("Pressure to apply") +
        [
          names.length >= 2
            ? `${names[0]} and ${names[1]} both act reasonably and still cannot both get what they want.`
            : "Two characters, both right, mutually exclusive goals.",
          "The thing that made the POV character sympathetic in chapter one becomes the reason they fail here.",
          "Make the cost land on someone who did nothing to deserve it, and have the POV character know it.",
          "Remove the option the reader has been assuming was the way out.",
        ].join("\n\n");

    case "lore":
      return head("Lore to grow") +
        (ctx.entities.length
          ? ctx.entities
              .map(
                (e) =>
                  `${e.name} — ${
                    e.details.length
                      ? `you have ${e.details.length} detail${e.details.length === 1 ? "" : "s"} recorded. What is the thing about it that everyone locally knows and no outsider would guess?`
                      : "nothing recorded yet. Start with what it smells like at dawn and who profits from it."
                  }`,
              )
              .join("\n\n")
          : "Link entities into this scene first, then this can build on them.");

    case "branch-check": {
      const g = ctx.game;
      if (!g) return head("Branch check") + "No game narrative in this project yet.";
      const inert = g.dialogue.flatMap((d) => d.inertChoices);
      const endings = g.dialogue.flatMap((d) => d.endings);
      return head("Branch check") +
        [
          `${g.dialogue.reduce((n, d) => n + d.nodes, 0)} nodes across ${g.dialogue.length} conversation${g.dialogue.length === 1 ? "" : "s"}, ${endings.length} ending${endings.length === 1 ? "" : "s"}.`,
          endings.length <= 1
            ? "Only one ending. If the player's choices all funnel to the same place, they will feel it."
            : `Endings: ${endings.join(", ")}.`,
          inert.length
            ? `${inert.length} choice${inert.length === 1 ? "" : "s"} change no state at all — these read as flavour, not decisions: ${inert.slice(0, 5).map((c) => `"${c}"`).join(", ")}${inert.length > 5 ? "…" : ""}.`
            : "Every choice carries at least one effect.",
          g.issues.length
            ? `The debugger is also flagging: ${g.issues.slice(0, 3).join(" / ")}`
            : "The debugger is clean.",
        ]
          .filter(Boolean)
          .join("\n\n");
    }

    case "consequences": {
      const g = ctx.game;
      if (!g) return head("Consequences") + "No game narrative in this project yet.";
      const inert = g.dialogue.flatMap((d) => d.inertChoices);
      if (!inert.length) {
        return head("Consequences") + "Every choice already changes something. Next question is whether the changes are ones the player can notice.";
      }
      return head("Consequences for choices that currently do nothing") +
        inert
          .slice(0, 6)
          .map(
            (c) =>
              `"${c}" — pick one: move a relationship, move ${g.variables.find((v) => v.type === "integer")?.name ?? "a counter"}, set a flag a later scene reads, or transition a quest. A choice the state never records is a choice the player never made.`,
          )
          .join("\n\n");
    }

    case "quest-ideas": {
      const g = ctx.game;
      // Only people can want things — a location makes nonsense of this line.
      const names = ctx.entities
        .filter((e) => e.kind === "character")
        .map((e) => e.name);
      const vars = g?.variables.map((v) => v.name) ?? [];
      return head("Quest directions") +
        [
          vars.length
            ? `Build on state you already track — ${vars.slice(0, 4).join(", ")}. A quest that reads existing variables costs nothing to wire up and makes earlier choices matter.`
            : "Define a variable or two first; quests without state are just errands.",
          names.length
            ? `${names[0]} wants something they can't ask for directly. The quest is finding out what.`
            : "Give the quest giver a motive they'd rather not state.",
          "A quest that can be failed in an interesting way is worth two that can't.",
          "One objective the player can complete without noticing it was optional — reward attention rather than compliance.",
          g?.quests.length
            ? `Existing quests: ${g.quests.map((q) => q.name).join(", ")}. Consider one that makes an earlier reward turn into a liability.`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");
    }

    case "condense":
      return head("Tightening pass") +
        [
          "Candidates for cutting, in order:",
          "1. Any sentence that tells the reader something the next sentence shows.",
          "2. Stage directions between dialogue lines that only confirm who is speaking.",
          "3. The second half of every description that opens with a colour.",
          words > 0
            ? `Target: roughly ${Math.round(words * 0.75)} words, down from ${words}.`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

    default:
      return head(`${actionId} — offline`) +
        [
          "No AI provider is configured for this deployment, so this is a structured prompt rather than generated prose.",
          ctx.sceneTitle
            ? `Working on "${ctx.sceneTitle}"${ctx.chapterTitle ? ` in ${ctx.chapterTitle}` : ""}, ${words} words${names.length ? `, referencing ${names.join(", ")}` : ""}.`
            : "No scene is selected.",
          prompt.trim() ? `Your note: "${prompt.trim()}"` : "",
          "Set GEMINI_API_KEY or OPENAI_API_KEY on the server to enable generation. Suggestions will still be staged for review before anything is written.",
        ]
          .filter(Boolean)
          .join("\n\n");
  }
}
