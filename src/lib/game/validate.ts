import { conditionVars } from "./logic";
import type {
  Condition,
  Dialogue,
  GameNarrative,
  ValidationIssue,
  ValidationReport,
} from "./types";
import type { Entity } from "../types";

/**
 * The Narrative Debugger.
 *
 * Static analysis over the whole narrative — no execution, so it is safe to
 * run continuously while the writer edits. Every check maps to one of the
 * failure modes in the Phase 2 spec.
 */
export function validateNarrative(
  narrative: GameNarrative,
  entities: Entity[],
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const entityIds = new Set(entities.map((e) => e.id));
  const varNames = new Set(narrative.variables.map((v) => v.name));
  const questIds = new Set(narrative.quests.map((q) => q.id));
  const eventIds = new Set(narrative.events.map((e) => e.id));
  const factionIds = new Set(narrative.factions.map((f) => f.id));

  let conditionsChecked = 0;
  const allNodeIds = new Set<string>();
  const duplicates = new Set<string>();

  for (const d of narrative.dialogues) {
    for (const n of d.nodes) {
      if (allNodeIds.has(n.id)) duplicates.add(n.id);
      allNodeIds.add(n.id);
    }
  }
  for (const id of duplicates) {
    issues.push({
      level: "error",
      code: "duplicate-id",
      message: `Node id ${id} is used more than once. Exports key off these ids, so they must be unique.`,
    });
  }

  /* ---- variable + entity references inside conditions and effects ---- */

  const checkConditions = (
    conds: Condition[],
    where: string,
    ctx: Partial<ValidationIssue>,
  ) => {
    for (const c of conds) {
      conditionsChecked += 1;
      for (const name of conditionVars(c)) {
        if (
          !varNames.has(name) &&
          !name.startsWith("relationship.") &&
          !name.startsWith("faction.")
        ) {
          issues.push({
            level: "error",
            code: "missing-variable",
            message: `${where} reads "${name}" but no such variable exists.`,
            ...ctx,
          });
        }
      }
    }
  };

  for (const d of narrative.dialogues) {
    for (const n of d.nodes) {
      const ctx = { dialogueId: d.id, nodeId: n.id };

      if (n.speakerId && !entityIds.has(n.speakerId)) {
        issues.push({
          level: "error",
          code: "broken-reference",
          message: `${n.id} is spoken by a character that no longer exists.`,
          ...ctx,
        });
      }
      if (n.locationId && !entityIds.has(n.locationId)) {
        issues.push({
          level: "warning",
          code: "broken-reference",
          message: `${n.id} points at a location that no longer exists.`,
          ...ctx,
        });
      }

      checkConditions(n.conditions, n.id, ctx);
      for (const e of n.effects) checkEffectTarget(e, n.id, ctx);

      for (const ch of n.choices) {
        checkConditions(ch.conditions, `${n.id} / "${ch.text}"`, ctx);
        for (const e of ch.effects) {
          checkEffectTarget(e, `${n.id} / "${ch.text}"`, ctx);
        }
        if (!ch.next) {
          issues.push({
            level: "warning",
            code: "dead-end",
            message: `Choice "${ch.text}" in ${n.id} has no destination.`,
            ...ctx,
          });
        } else if (!allNodeIds.has(ch.next)) {
          issues.push({
            level: "error",
            code: "broken-reference",
            message: `Choice "${ch.text}" in ${n.id} points at ${ch.next}, which does not exist.`,
            ...ctx,
          });
        }
      }

      if (n.next && !allNodeIds.has(n.next)) {
        issues.push({
          level: "error",
          code: "broken-reference",
          message: `${n.id} continues to ${n.next}, which does not exist.`,
          ...ctx,
        });
      }

      if (n.choices.length === 0 && !n.next && !n.isEnding) {
        issues.push({
          level: "warning",
          code: "missing-ending",
          message: `${n.id} stops the conversation but isn't marked as an ending.`,
          ...ctx,
        });
      }
    }
  }

  function checkEffectTarget(
    e: { kind: string; target: string },
    where: string,
    ctx: Partial<ValidationIssue>,
  ) {
    if (["set", "add", "sub"].includes(e.kind)) {
      if (
        !varNames.has(e.target) &&
        !e.target.startsWith("relationship.") &&
        !e.target.startsWith("faction.")
      ) {
        issues.push({
          level: "error",
          code: "missing-variable",
          message: `${where} writes to "${e.target}" but no such variable exists.`,
          ...ctx,
        });
      }
    }
    if (e.kind === "quest" && !questIds.has(e.target)) {
      issues.push({
        level: "error",
        code: "broken-reference",
        message: `${where} changes quest ${e.target}, which does not exist.`,
        ...ctx,
      });
    }
    if (e.kind === "event" && !eventIds.has(e.target)) {
      issues.push({
        level: "error",
        code: "broken-reference",
        message: `${where} fires event ${e.target}, which does not exist.`,
        ...ctx,
      });
    }
    if (e.kind === "relationship" && !entityIds.has(e.target)) {
      issues.push({
        level: "warning",
        code: "broken-reference",
        message: `${where} changes a relationship with a character that no longer exists.`,
        ...ctx,
      });
    }
    if (e.kind === "faction" && !factionIds.has(e.target)) {
      issues.push({
        level: "warning",
        code: "broken-reference",
        message: `${where} changes faction ${e.target}, which does not exist.`,
        ...ctx,
      });
    }
  }

  /* ---------------------- reachability + cycles ---------------------- */

  const reachable = new Set<string>();
  const entryPoints: { dialogue: Dialogue; nodeId: string }[] = [];
  for (const d of narrative.dialogues) {
    if (d.entryNodeId) entryPoints.push({ dialogue: d, nodeId: d.entryNodeId });
  }
  if (entryPoints.length === 0 && narrative.dialogues.length > 0) {
    issues.push({
      level: "error",
      code: "no-entry",
      message: "No conversation has an entry node, so nothing can be played.",
    });
  }

  const nodeById = new Map(
    narrative.dialogues.flatMap((d) => d.nodes.map((n) => [n.id, n] as const)),
  );

  const walk = (id: string) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    const n = nodeById.get(id);
    if (!n) return;
    if (n.next) walk(n.next);
    for (const ch of n.choices) if (ch.next) walk(ch.next);
  };
  entryPoints.forEach((e) => walk(e.nodeId));

  for (const d of narrative.dialogues) {
    for (const n of d.nodes) {
      if (!reachable.has(n.id)) {
        issues.push({
          level: "warning",
          code: "unreachable-node",
          message: `${n.id} cannot be reached from any entry point.`,
          dialogueId: d.id,
          nodeId: n.id,
        });
      }
    }
  }

  // Cycle detection — a loop is only a problem when nothing inside it can end
  // the conversation, so report it as information rather than an error.
  const colour = new Map<string, 0 | 1 | 2>();
  const cycles: string[][] = [];
  const stack: string[] = [];
  const dfs = (id: string) => {
    if (colour.get(id) === 1) {
      const at = stack.indexOf(id);
      if (at >= 0) cycles.push([...stack.slice(at), id]);
      return;
    }
    if (colour.get(id) === 2) return;
    colour.set(id, 1);
    stack.push(id);
    const n = nodeById.get(id);
    if (n) {
      if (n.next) dfs(n.next);
      for (const ch of n.choices) if (ch.next) dfs(ch.next);
    }
    stack.pop();
    colour.set(id, 2);
  };
  entryPoints.forEach((e) => dfs(e.nodeId));

  for (const cycle of cycles.slice(0, 5)) {
    const escapes = cycle.some((id) => {
      const n = nodeById.get(id);
      if (!n) return false;
      if (n.isEnding) return true;
      return n.choices.some((c) => c.next && !cycle.includes(c.next));
    });
    issues.push({
      level: escapes ? "info" : "error",
      code: "circular-flow",
      message: escapes
        ? `Loop: ${cycle.join(" → ")}. It has a way out, so this is probably deliberate.`
        : `Loop with no exit: ${cycle.join(" → ")}. A player would be stuck here.`,
      nodeId: cycle[0],
    });
  }

  /* -------------------------- quests + unused ------------------------ */

  for (const q of narrative.quests) {
    checkConditions(q.prerequisites, q.name, { questId: q.id });
    checkConditions(q.failWhen, q.name, { questId: q.id });
    for (const o of q.objectives) {
      checkConditions(o.completeWhen, `${q.name} / ${o.description}`, {
        questId: q.id,
      });
    }
    if (q.giverId && !entityIds.has(q.giverId)) {
      issues.push({
        level: "error",
        code: "broken-reference",
        message: `${q.name} is given by a character that no longer exists.`,
        questId: q.id,
      });
    }
    if (q.objectives.length === 0) {
      issues.push({
        level: "warning",
        code: "dead-end",
        message: `${q.name} has no objectives, so it can never be completed.`,
        questId: q.id,
      });
    }
    for (const u of q.unlocks) {
      if (!questIds.has(u)) {
        issues.push({
          level: "error",
          code: "broken-reference",
          message: `${q.name} unlocks ${u}, which does not exist.`,
          questId: q.id,
        });
      }
    }
  }

  // Variables that are never read anywhere.
  const readVars = new Set<string>();
  const collect = (conds: Condition[]) =>
    conds.forEach((c) => conditionVars(c).forEach((v) => readVars.add(v)));
  narrative.dialogues.forEach((d) =>
    d.nodes.forEach((n) => {
      collect(n.conditions);
      n.choices.forEach((c) => collect(c.conditions));
    }),
  );
  narrative.quests.forEach((q) => {
    collect(q.prerequisites);
    collect(q.failWhen);
    q.objectives.forEach((o) => collect(o.completeWhen));
  });
  narrative.events.forEach((e) => collect(e.conditions));

  for (const v of narrative.variables) {
    if (!readVars.has(v.name)) {
      issues.push({
        level: "info",
        code: "unused-content",
        message: `Variable "${v.name}" is never read by any condition.`,
      });
    }
  }

  /* --------------------------- coverage ------------------------------ */

  const usedCharacters = new Set<string>();
  const usedLocations = new Set<string>();
  narrative.dialogues.forEach((d) =>
    d.nodes.forEach((n) => {
      if (n.speakerId) usedCharacters.add(n.speakerId);
      if (n.locationId) usedLocations.add(n.locationId);
    }),
  );
  narrative.quests.forEach((q) => {
    if (q.giverId) usedCharacters.add(q.giverId);
    if (q.locationId) usedLocations.add(q.locationId);
  });

  const characters = entities.filter((e) => e.kind === "character");
  const locations = entities.filter((e) => e.kind === "location");

  for (const c of characters) {
    if (!usedCharacters.has(c.id)) {
      issues.push({
        level: "info",
        code: "unused-content",
        message: `${c.name} has no dialogue or quest references.`,
      });
    }
  }

  const order = { error: 0, warning: 1, info: 2 } as const;
  issues.sort((a, b) => order[a.level] - order[b.level]);

  return {
    ranAt: Date.now(),
    nodesChecked: allNodeIds.size,
    conditionsChecked,
    questsChecked: narrative.quests.length,
    issues,
    coverage: {
      reachableNodes: reachable.size,
      totalNodes: allNodeIds.size,
      usedCharacters: [...usedCharacters].filter((id) =>
        characters.some((c) => c.id === id),
      ).length,
      totalCharacters: characters.length,
      usedLocations: [...usedLocations].filter((id) =>
        locations.some((l) => l.id === id),
      ).length,
      totalLocations: locations.length,
    },
  };
}
