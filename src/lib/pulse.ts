import { collectRefs, docToText, readingOrder } from "./store";
import type { Chapter, Entity, Scene } from "./types";

export type ScenePoint = {
  id: string;
  title: string;
  chapter: string;
  words: number;
  tension: number;
  dialogue: number;
  cast: number;
};

/**
 * Audience Pulse.
 *
 * These are measurements of the text, not predictions about readers. Tension
 * is a heuristic — short sentences, conflict vocabulary, and cast density —
 * and is presented as a shape to interrogate, not a score to chase.
 */
const CHARGED =
  /\b(blood|scream|kill|die|died|death|fear|afraid|run|ran|fight|fought|burn|burned|break|broke|lost|lose|never|no|stop|please|gone|betray|hate|edge|cut|fall|fell|last|end)\b/gi;

export function pulse(scenes: Scene[], chapters: Chapter[]): ScenePoint[] {
  const ordered = readingOrder(scenes, chapters);
  return ordered.map((sc) => {
    const text = docToText(sc.doc);
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const sentences = trimmed
      ? trimmed.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim())
      : [];
    const avg = sentences.length ? words / sentences.length : 0;
    const charged = (text.match(CHARGED) ?? []).length;
    const dialogue = (text.match(/[“"]/g) ?? []).length / 2;
    const cast = collectRefs(sc.doc).size;

    // Short sentences and charged vocabulary read as pressure.
    const pace = avg > 0 ? Math.max(0, Math.min(1, (24 - avg) / 18)) : 0;
    const charge = words ? Math.min(1, (charged / words) * 22) : 0;
    const density = Math.min(1, cast / 5);
    const tension = Math.round(
      (pace * 0.4 + charge * 0.45 + density * 0.15) * 100,
    );

    const chapter = chapters.find((c) => c.id === sc.chapterId);
    return {
      id: sc.id,
      title: sc.title,
      chapter: chapter?.title ?? "",
      words,
      tension,
      dialogue: Math.round(dialogue),
      cast,
    };
  });
}

export type CastPresence = {
  entity: Entity;
  scenes: number;
  first: string;
  last: string;
  gapAfter: number;
};

export function castPresence(
  entities: Entity[],
  scenes: Scene[],
  chapters: Chapter[],
): CastPresence[] {
  const ordered = readingOrder(scenes, chapters);
  const index = new Map(ordered.map((s, i) => [s.id, i]));

  return entities
    .map((e) => {
      const inScenes = ordered.filter((s) => collectRefs(s.doc).has(e.id));
      if (!inScenes.length) return null;
      const lastIdx = index.get(inScenes[inScenes.length - 1].id) ?? 0;
      return {
        entity: e,
        scenes: inScenes.length,
        first: inScenes[0].title,
        last: inScenes[inScenes.length - 1].title,
        gapAfter: ordered.length - 1 - lastIdx,
      };
    })
    .filter((x): x is CastPresence => x !== null)
    .sort((a, b) => b.scenes - a.scenes);
}

export type Finding = { level: "note" | "warn"; text: string };

export function findings(
  points: ScenePoint[],
  cast: CastPresence[],
  scenes: Scene[],
  entities: Entity[],
): Finding[] {
  const out: Finding[] = [];
  if (points.length === 0) return out;

  const total = points.reduce((n, p) => n + p.words, 0);
  const avg = total / points.length;

  const thin = points.filter((p) => p.words > 0 && p.words < avg * 0.35);
  if (thin.length) {
    out.push({
      level: "note",
      text: `${thin.length} scene${thin.length === 1 ? " is" : "s are"} well under half the average length — ${thin
        .slice(0, 3)
        .map((p) => p.title)
        .join(", ")}. Beats, or scenes still missing their middle?`,
    });
  }

  const flat = longestRun(points.map((p) => p.tension < 35));
  if (flat >= 3) {
    out.push({
      level: "warn",
      text: `${flat} scenes in a row read low on pressure. That is where a reader puts the book down.`,
    });
  }

  const noDialogue = points.filter((p) => p.dialogue === 0 && p.cast > 1);
  if (noDialogue.length) {
    out.push({
      level: "note",
      text: `${noDialogue.length} scene${noDialogue.length === 1 ? "" : "s"} put more than one character on the page without a word spoken.`,
    });
  }

  const dropped = cast.filter((c) => c.scenes >= 2 && c.gapAfter >= 3);
  for (const d of dropped.slice(0, 3)) {
    out.push({
      level: "warn",
      text: `${d.entity.name} last appears in "${d.last}" with ${d.gapAfter} scenes still to go. Deliberate exit, or a dropped thread?`,
    });
  }

  const unused = entities.filter(
    (e) => !scenes.some((s) => collectRefs(s.doc).has(e.id)),
  );
  if (unused.length) {
    out.push({
      level: "note",
      text: `${unused.length} World Matrix ${unused.length === 1 ? "entry has" : "entries have"} never made it into a scene.`,
    });
  }

  const peak = points.reduce((a, b) => (b.tension > a.tension ? b : a));
  const peakAt = points.indexOf(peak) / Math.max(1, points.length - 1);
  if (points.length >= 4 && peakAt < 0.4) {
    out.push({
      level: "note",
      text: `The tightest scene so far is "${peak.title}", which sits in the first ${Math.round(peakAt * 100)}% of the story. Worth checking that later scenes climb past it.`,
    });
  }

  return out;
}

function longestRun(flags: boolean[]) {
  let best = 0;
  let run = 0;
  for (const f of flags) {
    run = f ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
