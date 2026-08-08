import type { Draft } from "./store";
import { docToText, readingOrder } from "./store";

export function exportProject(s: Draft) {
  return {
    format: "inkandgears.project",
    version: 1,
    exportedAt: new Date().toISOString(),
    projectName: s.projectName,
    boards: s.boards,
    entities: s.entities,
    relationships: s.relationships,
    volumes: s.volumes,
    chapters: s.chapters,
    scenes: s.scenes,
    flows: s.flows,
  };
}

/** Manuscript export — structure preserved, no platform lock-in. */
export function projectToMarkdown(s: Draft): string {
  const out: string[] = [`# ${s.projectName}`, ""];

  for (const vol of [...s.volumes].sort((a, b) => a.order - b.order)) {
    out.push(`## ${vol.title}`, "");
    const chapters = s.chapters
      .filter((c) => c.volumeId === vol.id)
      .sort((a, b) => a.order - b.order);
    for (const ch of chapters) {
      out.push(`### ${ch.title}`, "");
      const scenes = s.scenes
        .filter((sc) => sc.chapterId === ch.id)
        .sort((a, b) => a.order - b.order);
      for (const sc of scenes) {
        out.push(`#### ${sc.title}`, "");
        out.push(docToText(sc.doc).replace(/\n{3,}/g, "\n\n").trim(), "");
      }
    }
  }

  if (s.entities.length) {
    out.push("---", "", "## World Matrix", "");
    for (const e of s.entities) {
      out.push(`### ${e.name} _(${e.kind})_`, "");
      if (e.description) out.push(e.description, "");
      for (const d of e.details) {
        out.push(d.label ? `- **${d.label}:** ${d.value}` : `- ${d.value}`);
      }
      const seen = readingOrder(s.scenes, s.chapters).filter((sc) =>
        JSON.stringify(sc.doc).includes(e.id),
      );
      if (seen.length) {
        out.push("", `_Appears in:_ ${seen.map((x) => x.title).join(", ")}`);
      }
      out.push("");
    }
  }

  return out.join("\n");
}

export function downloadBlob(filename: string, type: string, data: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
