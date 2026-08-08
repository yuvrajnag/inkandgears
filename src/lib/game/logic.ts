import type {
  Comparison,
  Condition,
  Effect,
  QuestState,
  VarValue,
  Variable,
} from "./types";

/* ------------------------------ stable ids ----------------------------- */

/**
 * Stable, human-readable ids. Exports and engine integration key off these,
 * so they are minted once and never regenerated — renaming a quest must not
 * change QUEST_003.
 */
export function nextId(prefix: string, existing: string[]): string {
  let max = 0;
  for (const id of existing) {
    const m = id.match(new RegExp(`^${prefix}_(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}_${String(max + 1).padStart(3, "0")}`;
}

/* ------------------------------ evaluation ----------------------------- */

export type EvalScope = Record<string, VarValue>;

function coerce(a: VarValue, b: VarValue): [VarValue, VarValue] {
  if (typeof a === "number" && typeof b === "string") {
    const n = Number(b);
    if (!Number.isNaN(n)) return [a, n];
  }
  if (typeof a === "string" && typeof b === "number") {
    const n = Number(a);
    if (!Number.isNaN(n)) return [n, b];
  }
  if (typeof a === "boolean" && typeof b === "string") {
    return [a, b === "true"];
  }
  return [a, b];
}

export function evalComparison(c: Comparison, scope: EvalScope): boolean {
  const raw = scope[c.varName];
  if (raw === undefined) return false; // missing variable never passes
  const [left, right] = coerce(raw, c.value);

  switch (c.op) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case ">":
      return Number(left) > Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<":
      return Number(left) < Number(right);
    case "<=":
      return Number(left) <= Number(right);
    case "contains":
      return String(left).includes(String(right));
    case "!contains":
      return !String(left).includes(String(right));
    default:
      return false;
  }
}

export function evalCondition(cond: Condition, scope: EvalScope): boolean {
  if (cond.kind === "compare") return evalComparison(cond, scope);
  const results = cond.children.map((c) => evalCondition(c, scope));
  if (cond.kind === "all") return results.every(Boolean);
  if (cond.kind === "any") return results.length === 0 || results.some(Boolean);
  return !results.some(Boolean); // none
}

/** An empty condition list is an unconditional pass. */
export function evalAll(conds: Condition[], scope: EvalScope): boolean {
  return conds.every((c) => evalCondition(c, scope));
}

/* ------------------------------- effects ------------------------------- */

export type EffectOutcome = {
  scope: EvalScope;
  questStates: Record<string, QuestState>;
  /** Human-readable log lines, one per applied effect. */
  log: string[];
  firedEvents: string[];
};

export function applyEffect(
  effect: Effect,
  outcome: EffectOutcome,
): EffectOutcome {
  const scope = { ...outcome.scope };
  const questStates = { ...outcome.questStates };
  const log = [...outcome.log];
  const firedEvents = [...outcome.firedEvents];

  switch (effect.kind) {
    case "set": {
      scope[effect.target] = effect.value;
      log.push(`${effect.target} = ${String(effect.value)}`);
      break;
    }
    case "add": {
      const cur = Number(scope[effect.target] ?? 0);
      const next = cur + Number(effect.value);
      scope[effect.target] = next;
      log.push(`${effect.target} += ${String(effect.value)}  (→ ${next})`);
      break;
    }
    case "sub": {
      const cur = Number(scope[effect.target] ?? 0);
      const next = cur - Number(effect.value);
      scope[effect.target] = next;
      log.push(`${effect.target} -= ${String(effect.value)}  (→ ${next})`);
      break;
    }
    case "quest": {
      const state = String(effect.value) as QuestState;
      questStates[effect.target] = state;
      log.push(`${effect.target} → ${state}`);
      break;
    }
    case "event": {
      if (!firedEvents.includes(effect.target)) firedEvents.push(effect.target);
      log.push(`event ${effect.target} fired`);
      break;
    }
    case "relationship": {
      const key = `relationship.${effect.target}`;
      const cur = Number(scope[key] ?? 0);
      const next = cur + Number(effect.value);
      scope[key] = next;
      log.push(`${key} += ${String(effect.value)}  (→ ${next})`);
      break;
    }
    case "faction": {
      const key = `faction.${effect.target}`;
      const cur = Number(scope[key] ?? 0);
      const next = cur + Number(effect.value);
      scope[key] = next;
      log.push(`${key} += ${String(effect.value)}  (→ ${next})`);
      break;
    }
  }

  return { scope, questStates, log, firedEvents };
}

export function applyEffects(
  effects: Effect[],
  outcome: EffectOutcome,
): EffectOutcome {
  return effects.reduce((acc, e) => applyEffect(e, acc), outcome);
}

/* ------------------------------ formatting ----------------------------- */

export function describeCondition(cond: Condition, depth = 0): string {
  if (cond.kind === "compare") {
    return `${cond.varName} ${cond.op} ${JSON.stringify(cond.value)}`;
  }
  const word = cond.kind === "all" ? "AND" : cond.kind === "any" ? "OR" : "NOT";
  const inner = cond.children.map((c) => describeCondition(c, depth + 1));
  if (inner.length === 0) return `(${word}: empty)`;
  if (inner.length === 1 && cond.kind !== "none") return inner[0];
  return depth === 0
    ? inner.join(` ${word} `)
    : `(${inner.join(` ${word} `)})`;
}

export function describeEffect(e: Effect): string {
  switch (e.kind) {
    case "set":
      return `${e.target} = ${String(e.value)}`;
    case "add":
      return `${e.target} += ${String(e.value)}`;
    case "sub":
      return `${e.target} -= ${String(e.value)}`;
    case "quest":
      return `quest ${e.target} → ${String(e.value)}`;
    case "event":
      return `fire ${e.target}`;
    case "relationship":
      return `relationship.${e.target} += ${String(e.value)}`;
    case "faction":
      return `faction.${e.target} += ${String(e.value)}`;
  }
}

/** Collects every variable name a condition tree reads. */
export function conditionVars(cond: Condition, out: Set<string> = new Set()) {
  if (cond.kind === "compare") out.add(cond.varName);
  else cond.children.forEach((c) => conditionVars(c, out));
  return out;
}

export function initialScope(
  variables: Variable[],
  relationships: { characterId: string; axis: string; initial: number }[] = [],
  factions: { id: string; initialReputation: number }[] = [],
): EvalScope {
  const scope: EvalScope = {};
  for (const v of variables) scope[v.name] = v.initial;
  for (const r of relationships) {
    scope[`relationship.${r.characterId}`] = r.initial;
  }
  for (const f of factions) scope[`faction.${f.id}`] = f.initialReputation;
  return scope;
}
