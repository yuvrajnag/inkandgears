"use client";

import {
  Flag,
  MessageSquare,
  Users,
  MapPin,
  Variable as VarIcon,
  Zap,
  AlertTriangle,
  EyeOff,
  Download,
  Play,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, cx } from "@/components/ui/primitives";
import { downloadBlob } from "@/lib/exporters";
import {
  buildPackage,
  packageToJson,
  localizationCsv,
} from "@/lib/game/exportGame";
import type { ValidationReport } from "@/lib/game/types";

export function GameDashboard({
  report,
  onGo,
}: {
  report: ValidationReport;
  onGo: (v: "quests" | "dialogue" | "state" | "play" | "debug") => void;
}) {
  const narrative = useStore((s) => s.narrative);
  const entities = useStore((s) => s.entities);
  const projectName = useStore((s) => s.projectName);

  const nodes = narrative.dialogues.reduce((n, d) => n + d.nodes.length, 0);
  const characters = entities.filter((e) => e.kind === "character").length;
  const locations = entities.filter((e) => e.kind === "location").length;
  const errors = report.issues.filter((i) => i.level === "error").length;
  const warnings = report.issues.filter((i) => i.level === "warning").length;
  const unreachable = report.coverage.totalNodes - report.coverage.reachableNodes;

  const stats = [
    { icon: <Flag size={17} />, label: "Quests", value: narrative.quests.length, to: "quests" as const },
    { icon: <MessageSquare size={17} />, label: "Dialogue nodes", value: nodes, to: "dialogue" as const },
    { icon: <Users size={17} />, label: "Characters", value: characters, to: null },
    { icon: <MapPin size={17} />, label: "Locations", value: locations, to: null },
    { icon: <VarIcon size={17} />, label: "Variables", value: narrative.variables.length, to: "state" as const },
    { icon: <Zap size={17} />, label: "Events", value: narrative.events.length, to: "state" as const },
    { icon: <AlertTriangle size={17} />, label: "Warnings", value: errors + warnings, to: "debug" as const, alert: errors > 0 },
    { icon: <EyeOff size={17} />, label: "Unreachable", value: unreachable, to: "debug" as const, alert: unreachable > 0 },
  ];

  function exportJson() {
    const pkg = buildPackage(projectName, narrative, entities);
    downloadBlob(
      `${projectName} narrative.json`,
      "application/json",
      packageToJson(pkg),
    );
  }

  function exportCsv() {
    downloadBlob(
      `${projectName} lines.csv`,
      "text/csv",
      localizationCsv(narrative),
    );
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[13px] uppercase tracking-[0.18em] text-faint">
            Game Narrative Studio
          </p>
          <h1 className="font-display text-[26px] font-extrabold leading-none sm:text-[34px]">
            {projectName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onGo("play")}>
            <Play size={15} /> Play
          </Button>
          <Button variant="outline" onClick={exportJson}>
            <Download size={14} /> Export JSON
          </Button>
          <Button variant="ghost" onClick={exportCsv}>
            Lines CSV
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => s.to && onGo(s.to)}
            disabled={!s.to}
            className={cx(
              "rounded-[14px] border-2 bg-raise/50 p-4 text-left transition-all",
              s.to ? "cursor-pointer hover:bg-raise" : "cursor-default",
              s.alert
                ? "border-amber-500/40 hover:border-amber-500/70"
                : "border-line hover:border-accent/40",
            )}
          >
            <span
              className={cx(
                "mb-2 block",
                s.alert ? "text-amber-400" : "text-dim",
              )}
            >
              {s.icon}
            </span>
            <p
              className={cx(
                "font-display text-[24px] font-extrabold leading-none",
                s.alert ? "text-amber-300" : "text-accent-soft",
              )}
            >
              {s.value}
            </p>
            <p className="mt-1 text-[13px] text-faint">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[16px] font-medium">Narrative coverage</h2>
          <div className="space-y-3 rounded-[14px] border-2 border-line bg-raise/50 p-4">
            <Bar
              label="Reachable nodes"
              used={report.coverage.reachableNodes}
              total={report.coverage.totalNodes}
            />
            <Bar
              label="Characters used"
              used={report.coverage.usedCharacters}
              total={report.coverage.totalCharacters}
            />
            <Bar
              label="Locations used"
              used={report.coverage.usedLocations}
              total={report.coverage.totalLocations}
            />
            <p className="border-t border-line pt-3 text-[12.5px] leading-relaxed text-faint">
              Validation runs continuously while you edit — {report.nodesChecked}{" "}
              nodes, {report.conditionsChecked} conditions and{" "}
              {report.questsChecked} quests checked.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[16px] font-medium">Needs attention</h2>
          {report.issues.length === 0 ? (
            <p className="rounded-[14px] border-2 border-line bg-raise/50 px-4 py-6 text-center text-[13px] text-faint">
              Nothing flagged. The narrative is internally consistent.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {report.issues.slice(0, 6).map((issue, i) => (
                <li
                  key={i}
                  className={cx(
                    "rounded-lg border bg-raise/50 px-3 py-2 text-[12.5px] leading-relaxed",
                    issue.level === "error"
                      ? "border-red-500/30 text-red-200/90"
                      : issue.level === "warning"
                        ? "border-amber-500/25 text-amber-100/80"
                        : "border-line text-dim",
                  )}
                >
                  {issue.message}
                </li>
              ))}
              {report.issues.length > 6 && (
                <li>
                  <button
                    onClick={() => onGo("debug")}
                    className="px-3 py-1 text-[12.5px] text-accent hover:text-accent-soft"
                  >
                    {report.issues.length - 6} more in the debugger →
                  </button>
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Bar({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((used / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
        <span className="text-dim">{label}</span>
        <span className="text-faint">
          {used} / {total}
        </span>
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-raise2">
        <span
          className={cx(
            "block h-full rounded-full",
            pct === 100 ? "bg-emerald-500/70" : "bg-accent/70",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
