"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "@/components/board/BoardBar";
import { cx } from "@/components/ui/primitives";
import { validateNarrative } from "@/lib/game/validate";
import { GameDashboard } from "./GameDashboard";
import { QuestForge } from "./QuestForge";
import { DialogueForge } from "./DialogueForge";
import { StateMatrix } from "./StateMatrix";
import { Simulator } from "./Simulator";
import { DebugReport } from "./DebugReport";

const VIEWS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "quests", label: "Quest Forge" },
  { id: "dialogue", label: "Dialogue Forge" },
  { id: "state", label: "State Matrix" },
  { id: "play", label: "Play" },
  { id: "debug", label: "Debug" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function GameStudio() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const view = (params.get("v") as ViewId) || "dashboard";

  const narrative = useStore((s) => s.narrative);
  const entities = useStore((s) => s.entities);

  // Validation is cheap and static, so it runs continuously while editing
  // rather than only on demand — broken logic surfaces as you type.
  const report = useMemo(
    () => validateNarrative(narrative, entities),
    [narrative, entities],
  );

  const errors = report.issues.filter((i) => i.level === "error").length;
  const warnings = report.issues.filter((i) => i.level === "warning").length;

  const go = (v: ViewId) => router.push(`/game?v=${v}`);

  if (!hydrated) return <div className="h-full" />;

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[
          { label: "Game Narrative Studio" },
          ...(view === "dashboard"
            ? []
            : [{ label: VIEWS.find((v) => v.id === view)?.label ?? view }]),
        ]}
        createLabel="Play"
        onCreate={() => go("play")}
      />

      {/* ---- studio sub-navigation ---- */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto px-3 pt-3 sm:px-4">
        {VIEWS.map((v) => {
          const active = v.id === view;
          const badge =
            v.id === "debug" && errors + warnings > 0
              ? errors > 0
                ? errors
                : warnings
              : null;
          return (
            <button
              key={v.id}
              onClick={() => go(v.id)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] transition-colors sm:text-[16px]",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-dim hover:bg-raise hover:text-ink",
              )}
            >
              {v.label}
              {badge !== null && (
                <span
                  className={cx(
                    "grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-bold",
                    errors > 0 ? "bg-red-500/80 text-white" : "bg-amber-500/80 text-black",
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-4 sm:px-6 lg:px-10">
        {view === "dashboard" && <GameDashboard report={report} onGo={go} />}
        {view === "quests" && <QuestForge />}
        {view === "dialogue" && <DialogueForge />}
        {view === "state" && <StateMatrix />}
        {view === "play" && <Simulator />}
        {view === "debug" && <DebugReport report={report} onGo={go} />}
      </div>
    </div>
  );
}
