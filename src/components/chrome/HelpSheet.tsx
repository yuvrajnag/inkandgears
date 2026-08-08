"use client";

import { Modal } from "@/components/ui/primitives";
import { ENTITY_KINDS } from "@/lib/types";

const KEYS: [string, string][] = [
  ["Ctrl / ⌘ + S", "Save project"],
  ["Ctrl / ⌘ + Z", "Undo"],
  ["Ctrl / ⌘ + ⇧ + Z", "Redo"],
  ["Ctrl / ⌘ + B / I / U", "Bold · Italic · Underline"],
  ["Ctrl / ⌘ + K", "Commands (AI assistant)"],
  ["/", "Insert a story entity while writing"],
];

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Help" onClose={onClose} width="max-w-2xl">
      <div className="space-y-6 text-[16.9px] leading-relaxed text-ink/90">
        <section>
          <h3 className="mb-2 font-display text-[20.8px] text-ink">
            The four modules
          </h3>
          <dl className="space-y-1.5 text-dim">
            <div>
              <dt className="inline text-ink">Script</dt>
              <dd className="inline"> — Draft Canvas. Chapters, scenes, and the writing itself.</dd>
            </div>
            <div>
              <dt className="inline text-ink">Board</dt>
              <dd className="inline"> — World Matrix. Characters, locations, and every other thing that exists in your story.</dd>
            </div>
            <div>
              <dt className="inline text-ink">Flow</dt>
              <dd className="inline"> — Thread Map. Node-based planning for structure, timelines, and relationships.</dd>
            </div>
            <div>
              <dt className="inline text-ink">Home</dt>
              <dd className="inline"> — Cosmos. Project state, version history, and story analysis.</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="mb-2 font-display text-[20.8px] text-ink">
            Slash commands
          </h3>
          <p className="mb-2.5 text-dim">
            Type a slash in the editor to drop a story entity into your prose.
            The link is recorded for you — the entity&apos;s page will list the
            scene under <span className="text-ink">Appeared in</span> without
            you touching it.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ENTITY_KINDS.map((k) => (
              <span
                key={k.kind}
                className="rounded-md border border-line2 bg-raise px-2 py-1 text-[15px]"
              >
                <code className="font-mono text-accent">/{k.slash}</code>
                <span className="ml-1.5 text-dim">{k.label}</span>
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-display text-[20.8px] text-ink">Shortcuts</h3>
          <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {KEYS.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dt>
                  <kbd className="rounded border border-line2 bg-raise px-1.5 py-0.5 font-mono text-[14.3px] text-ink">
                    {k}
                  </kbd>
                </dt>
                <dd className="text-dim">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="mb-2 font-display text-[20.8px] text-ink">Your work</h3>
          <p className="text-dim">
            Everything lives in this browser and autosaves as you type. Use the
            caret next to undo/redo in the top-left to export a full JSON backup
            or a Markdown manuscript at any time.
          </p>
        </section>
      </div>
    </Modal>
  );
}
