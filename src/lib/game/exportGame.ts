import type { Entity } from "../types";
import type { GameNarrative } from "./types";

/**
 * Export pipeline.
 *
 * Produces the narrative package from the Phase 2 spec — one file per concern,
 * every object keyed by its stable id so a game engine can re-import without
 * anything shifting underneath it.
 */
export type NarrativePackage = Record<string, unknown>;

export function buildPackage(
  projectName: string,
  narrative: GameNarrative,
  entities: Entity[],
): NarrativePackage {
  const characters = entities.filter((e) => e.kind === "character");
  const locations = entities.filter((e) => e.kind === "location");

  const meta = {
    format: "inkandgears.narrative",
    version: 1,
    project: projectName,
    exportedAt: new Date().toISOString(),
    counts: {
      quests: narrative.quests.length,
      dialogues: narrative.dialogues.length,
      nodes: narrative.dialogues.reduce((n, d) => n + d.nodes.length, 0),
      variables: narrative.variables.length,
      events: narrative.events.length,
      factions: narrative.factions.length,
    },
  };

  const strip = (e: Entity) => ({
    id: e.id,
    name: e.name,
    kind: e.kind,
    description: e.description,
    details: e.details.map((d) => ({
      label: d.label,
      value: d.value,
      type: d.type,
    })),
  });

  return {
    "meta.json": meta,
    "characters.json": characters.map(strip),
    "locations.json": locations.map(strip),
    "quests.json": narrative.quests,
    "dialogue.json": narrative.dialogues,
    "variables.json": narrative.variables,
    "events.json": narrative.events,
    "factions.json": narrative.factions,
    "relationships.json": narrative.relationships,
    // Line ids kept separate so translation can be handed off on its own.
    "localization.json": narrative.dialogues.flatMap((d) =>
      d.nodes.map((n) => ({
        lineId: n.voiceLineId ?? n.id,
        speaker: n.speakerId ?? "",
        text: n.text,
        emotion: n.emotion,
        dialogue: d.id,
      })),
    ),
  };
}

/** A single flat JSON file — the simplest thing an engine can consume. */
export function packageToJson(pkg: NarrativePackage): string {
  return JSON.stringify(pkg, null, 2);
}

/** Dialogue as CSV, which is what most localisation vendors want. */
export function localizationCsv(narrative: GameNarrative): string {
  const rows = [["line_id", "speaker", "emotion", "dialogue_id", "text"]];
  for (const d of narrative.dialogues) {
    for (const n of d.nodes) {
      rows.push([
        n.voiceLineId ?? n.id,
        n.speakerId ?? "",
        n.emotion,
        d.id,
        n.text,
      ]);
      for (const c of n.choices) {
        rows.push([c.id, "PLAYER", "neutral", d.id, c.text]);
      }
    }
  }
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
