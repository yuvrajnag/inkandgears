"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { exportProject, downloadBlob, projectToMarkdown } from "@/lib/exporters";

export function ProjectMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useStore();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const item =
    "w-full rounded-md px-2.5 py-1.5 text-left text-[16.2px] text-ink/90 transition-colors hover:bg-raise2";

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute left-4 top-14 z-40 w-56 rounded-xl border border-line2 bg-panel p-1.5 shadow-2xl"
    >
      <p className="px-2.5 pb-1 pt-1 text-[13.7px] uppercase tracking-wider text-faint">
        Project
      </p>
      <button
        className={item}
        onClick={() => {
          downloadBlob(
            `${state.projectName}.json`,
            "application/json",
            JSON.stringify(exportProject(state), null, 2),
          );
          onClose();
        }}
      >
        Export backup (JSON)
      </button>
      <button
        className={item}
        onClick={() => {
          downloadBlob(
            `${state.projectName}.md`,
            "text/markdown",
            projectToMarkdown(state),
          );
          onClose();
        }}
      >
        Export manuscript (Markdown)
      </button>
      <label className={`${item} block cursor-pointer`}>
        Import backup…
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              state.importProject(JSON.parse(await f.text()));
            } catch {
              /* a malformed file must never wipe the current project */
            }
            onClose();
          }}
        />
      </label>
      <div className="my-1 h-px bg-line" />
      <button
        className={`${item} text-red-300 hover:bg-red-500/10`}
        onClick={() => {
          if (
            confirm(
              "Reset this project back to the sample story? Your current work will be lost.",
            )
          ) {
            state.resetProject();
          }
          onClose();
        }}
      >
        Reset to sample project
      </button>
    </div>
  );
}
