"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { cx } from "@/components/ui/primitives";
import type { IssueLevel, ValidationReport } from "@/lib/game/types";

const LABELS: Record<string, string> = {
  "unreachable-node": "Unreachable",
  "dead-end": "Dead end",
  "missing-variable": "Missing variable",
  "broken-reference": "Broken reference",
  "impossible-branch": "Impossible branch",
  "circular-flow": "Loop",
  "missing-ending": "Missing ending",
  "unused-content": "Unused",
  "duplicate-id": "Duplicate id",
  "no-entry": "No entry point",
};

export function DebugReport({
  report,
  onGo,
}: {
  report: ValidationReport;
  onGo: (v: "dialogue" | "quests" | "state") => void;
}) {
  const [filter, setFilter] = useState<IssueLevel | "all">("all");

  const counts = {
    error: report.issues.filter((i) => i.level === "error").length,
    warning: report.issues.filter((i) => i.level === "warning").length,
    info: report.issues.filter((i) => i.level === "info").length,
  };
  const shown = report.issues.filter(
    (i) => filter === "all" || i.level === filter,
  );

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="mb-1 font-display text-[24px] font-extrabold sm:text-[30px]">
        Narrative Debugger
      </h1>
      <p className="mb-5 text-[14px] text-dim">
        Static analysis over the whole narrative. Runs on every edit, so nothing
        here needs a build step.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Nodes checked" value={report.nodesChecked} />
        <Tile label="Conditions checked" value={report.conditionsChecked} />
        <Tile label="Quests checked" value={report.questsChecked} />
        <Tile
          label="Reachable"
          value={`${report.coverage.reachableNodes}/${report.coverage.totalNodes}`}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["all", `Everything (${report.issues.length})`],
            ["error", `Errors (${counts.error})`],
            ["warning", `Warnings (${counts.warning})`],
            ["info", `Notes (${counts.info})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cx(
              "rounded-md border px-2.5 py-1 text-[13px] transition-colors",
              filter === k
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-line2 text-dim hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-[14px] border-2 border-emerald-500/30 bg-emerald-500/5 px-4 py-10 text-center">
          <ShieldCheck size={26} className="mx-auto mb-3 text-emerald-400" />
          <p className="text-[15px] text-emerald-200/90">
            {filter === "all"
              ? "No problems found. Every node is reachable and every reference resolves."
              : "Nothing at this level."}
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((issue, i) => {
            const Icon =
              issue.level === "error"
                ? AlertCircle
                : issue.level === "warning"
                  ? AlertTriangle
                  : Info;
            const target = issue.questId
              ? "quests"
              : issue.nodeId || issue.dialogueId
                ? "dialogue"
                : "state";
            return (
              <li key={i}>
                <button
                  onClick={() => onGo(target)}
                  className={cx(
                    "flex w-full items-start gap-2.5 rounded-lg border bg-raise/50 px-3 py-2.5 text-left transition-colors",
                    issue.level === "error"
                      ? "border-red-500/30 hover:border-red-500/60"
                      : issue.level === "warning"
                        ? "border-amber-500/25 hover:border-amber-500/50"
                        : "border-line hover:border-line2",
                  )}
                >
                  <Icon
                    size={15}
                    className={cx(
                      "mt-0.5 shrink-0",
                      issue.level === "error"
                        ? "text-red-400"
                        : issue.level === "warning"
                          ? "text-amber-400"
                          : "text-faint",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] leading-relaxed text-ink/90">
                      {issue.message}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-faint">
                      {LABELS[issue.code] ?? issue.code}
                      {issue.nodeId && ` · ${issue.nodeId}`}
                      {issue.questId && ` · ${issue.questId}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[14px] border-2 border-line bg-raise/50 p-3.5">
      <p className="font-display text-[20px] font-extrabold leading-none text-accent-soft">
        {value}
      </p>
      <p className="mt-1 text-[12.5px] text-faint">{label}</p>
    </div>
  );
}
