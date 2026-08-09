"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  PenLine,
  Boxes,
  Workflow,
  Gamepad2,
  Activity,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useStore, readingOrder } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { castPresence, findings, pulse } from "@/lib/pulse";
import { cx } from "@/components/ui/primitives";
import { TensionChart } from "./TensionChart";
import { routes } from "@/lib/routes";

export function Home() {
  const hydrated = useHydrated();
  const projectName = useStore((s) => s.projectName);
  const setProjectName = useStore((s) => s.setProjectName);
  const scenes = useStore((s) => s.scenes);
  const chapters = useStore((s) => s.chapters);
  const entities = useStore((s) => s.entities);
  const flows = useStore((s) => s.flows);
  const narrative = useStore((s) => s.narrative);
  const versions = useStore((s) => s.versions);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const setActiveScene = useStore((s) => s.setActiveScene);

  const [tab, setTab] = useState<"cosmos" | "pulse">("cosmos");

  const points = useMemo(() => pulse(scenes, chapters), [scenes, chapters]);
  const cast = useMemo(
    () => castPresence(entities, scenes, chapters),
    [entities, scenes, chapters],
  );
  const issues = useMemo(
    () => findings(points, cast, scenes, entities),
    [points, cast, scenes, entities],
  );

  const totalWords = scenes.reduce((n, s) => n + s.words, 0);
  const recent = useMemo(
    () => [...scenes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [scenes],
  );
  const ordered = useMemo(
    () => readingOrder(scenes, chapters),
    [scenes, chapters],
  );

  if (!hydrated) return <div className="h-full" />;

  return (
    <div className="h-full overflow-y-auto px-4 pb-10 pt-5 sm:px-6 sm:pt-6">
      <div className="mx-auto max-w-[1080px]">
        {/* ---- header ---- */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[14.3px] uppercase tracking-[0.18em] text-faint">
              Project
            </p>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              aria-label="Project name"
              className="w-full max-w-md bg-transparent font-display text-[33.8px] font-bold leading-none outline-none focus:text-accent-soft sm:text-[44.2px]"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-line2 bg-raise p-1">
            {(
              [
                ["cosmos", "Cosmos"],
                ["pulse", "Audience Pulse"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-[15.6px] transition-colors",
                  tab === k
                    ? "bg-accent/15 text-accent"
                    : "text-dim hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- module cards ---- */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleCard
            href="/script"
            icon={<PenLine size={21} />}
            title="Draft Canvas"
            sub="Script"
            stat={`${totalWords.toLocaleString()} words`}
            detail={`${scenes.length} scenes · ${chapters.length} chapters`}
          />
          <ModuleCard
            href="/board"
            icon={<Boxes size={21} />}
            title="World Matrix"
            sub="Board"
            stat={`${entities.length} entries`}
            detail={`${entities.filter((e) => e.kind === "character").length} characters · ${entities.filter((e) => e.kind === "location").length} places`}
          />
          <ModuleCard
            href="/flow"
            icon={<Workflow size={21} />}
            title="Thread Map"
            sub="Flow"
            stat={`${flows.length} flow${flows.length === 1 ? "" : "s"}`}
            detail={`${flows.reduce((n, f) => n + f.nodes.length, 0)} nodes planned`}
          />
          <ModuleCard
            href={routes.game}
            icon={<Gamepad2 size={21} />}
            title="Narrative Studio"
            sub="Game"
            stat={`${narrative.quests.length} quest${narrative.quests.length === 1 ? "" : "s"}`}
            detail={`${narrative.dialogues.reduce((n, d) => n + d.nodes.length, 0)} dialogue nodes · ${narrative.variables.length} variables`}
          />
        </div>

        {tab === "cosmos" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <section>
              <h2 className="mb-3 text-[16.9px] font-medium">Recent scenes</h2>
              <ul className="space-y-1.5">
                {recent.map((sc) => {
                  const ch = chapters.find((c) => c.id === sc.chapterId);
                  return (
                    <li key={sc.id}>
                      <Link
                        href="/script"
                        onClick={() => setActiveScene(sc.id)}
                        className="group flex items-center gap-3 rounded-xl border border-line bg-raise/50 px-3.5 py-2.5 transition-colors hover:border-accent/40"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16.9px]">
                            {sc.title}
                          </span>
                          <span className="block truncate text-[14.3px] text-faint">
                            {ch?.title} · {sc.status} · {sc.words} words
                          </span>
                        </span>
                        <ArrowRight
                          size={18}
                          className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                        />
                      </Link>
                    </li>
                  );
                })}
                {recent.length === 0 && (
                  <li className="rounded-xl border border-line bg-raise/50 px-3.5 py-6 text-center text-[15.6px] text-faint">
                    No scenes yet.
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-[16.9px] font-medium">Continuity</h2>
              <div className="space-y-2 rounded-xl border border-line bg-raise/50 p-3.5 text-[15.6px]">
                <Row
                  label="Saved"
                  value={
                    lastSavedAt
                      ? new Date(lastSavedAt).toLocaleTimeString()
                      : "not yet this session"
                  }
                />
                <Row label="Restore points" value={`${versions.length}`} />
                <Row
                  label="Linked entities"
                  value={`${cast.length} of ${entities.length}`}
                />
                <Row
                  label="Reading time"
                  value={`${Math.max(1, Math.round(totalWords / 230))} min`}
                />
                <p className="border-t border-line pt-2.5 text-[14.3px] leading-relaxed text-faint">
                  <Clock size={14} className="mr-1 inline align-[-1px]" />
                  Everything is stored in this browser and saves as you type.
                  Export a backup from the caret beside undo.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Activity size={18} className="text-accent" />
                <h2 className="text-[16.9px] font-medium">
                  Tension across the reading order
                </h2>
              </div>
              <TensionChart
                points={points}
                onPick={(id) => setActiveScene(id)}
              />
              <p className="mt-2 text-[14.3px] leading-relaxed text-faint">
                Measured from sentence length, charged vocabulary, and how many
                characters share the page. It describes the shape of your prose
                — it does not predict how anyone will feel reading it.
              </p>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 text-[16.9px] font-medium">
                  Character presence
                </h2>
                {cast.length === 0 ? (
                  <p className="rounded-xl border border-line bg-raise/50 px-3.5 py-6 text-center text-[15.6px] text-faint">
                    Nothing linked into scenes yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {cast.slice(0, 8).map((c) => (
                      <li key={c.entity.id}>
                        <Link
                          href={routes.entity(c.entity.id)}
                          className="flex items-center gap-3 rounded-lg border border-line bg-raise/50 px-3 py-2 transition-colors hover:border-accent/40"
                        >
                          <span className="w-20 shrink-0 truncate text-[15.6px] sm:w-28">
                            {c.entity.name}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raise2">
                            <span
                              className="block h-full rounded-full bg-accent/70"
                              style={{
                                width: `${(c.scenes / (cast[0]?.scenes || 1)) * 100}%`,
                              }}
                            />
                          </span>
                          <span className="w-16 shrink-0 text-right text-[13.7px] text-faint">
                            {c.scenes} scene{c.scenes === 1 ? "" : "s"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-[16.9px] font-medium">
                  What the text is telling you
                </h2>
                {issues.length === 0 ? (
                  <p className="rounded-xl border border-line bg-raise/50 px-3.5 py-6 text-center text-[15.6px] text-faint">
                    Nothing worth flagging — or not enough written yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {issues.map((f, i) => (
                      <li
                        key={i}
                        className={cx(
                          "rounded-lg border bg-raise/50 px-3 py-2 text-[15px] leading-relaxed",
                          f.level === "warn"
                            ? "border-amber-500/25 text-amber-100/80"
                            : "border-line text-dim",
                        )}
                      >
                        {f.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section>
              <h2 className="mb-3 text-[16.9px] font-medium">Chapter pacing</h2>
              <div className="flex flex-wrap gap-1.5">
                {chapters
                  .sort((a, b) => a.order - b.order)
                  .map((ch) => {
                    const list = ordered.filter((s) => s.chapterId === ch.id);
                    const words = list.reduce((n, s) => n + s.words, 0);
                    return (
                      <div
                        key={ch.id}
                        className="rounded-lg border border-line bg-raise/50 px-3 py-2"
                      >
                        <p className="text-[15.6px]">{ch.title}</p>
                        <p className="text-[13.7px] text-faint">
                          {list.length} scenes · {words} words
                        </p>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({
  href,
  icon,
  title,
  sub,
  stat,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  stat: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-raise/50 p-4 transition-all hover:border-accent/40 hover:bg-raise"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-dim transition-colors group-hover:text-accent">
          {icon}
        </span>
        <span className="text-[13px] uppercase tracking-wider text-faint">
          {sub}
        </span>
      </div>
      <p className="text-[18.2px] font-medium">{title}</p>
      <p className="mt-1.5 text-[24.7px] font-semibold text-accent-soft">
        {stat}
      </p>
      <p className="text-[14.3px] text-faint">{detail}</p>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-faint">{label}</span>
      <span className="truncate text-ink">{value}</span>
    </div>
  );
}
