"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TextAlign } from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { EntityRef } from "./entityRef";
import { SlashCommand, type SlashItem } from "./slashCommand";
import type { MenuState } from "./SlashMenu";
import { useStore } from "@/lib/store";
import { ENTITY_KINDS, type Entity, type EntityKind } from "@/lib/types";

const PLACEHOLDER =
  "Start writing. Type / to bring a character or a place into the scene.";

/*
 * The slash-command plugin is constructed once and then lives inside
 * ProseMirror, where React state is not reachable. This module-scoped bridge
 * is how the plugin sees the current entity list and highlighted row. Exactly
 * one Draft Canvas editor is mounted at a time, so a single bridge is enough.
 */
const bridge = { index: 0, entities: [] as Entity[] };

export function useDraftEditor({
  sceneId,
  initialDoc,
  onUpdate,
}: {
  sceneId: string;
  initialDoc: unknown;
  onUpdate: (doc: unknown) => void;
}) {
  const [menu, setMenu] = useState<MenuState>(null);
  const [index, setIndex] = useState(0);

  const setActiveIndex = useCallback((i: number) => {
    bridge.index = i;
    setIndex(i);
  }, []);

  useEffect(() => {
    bridge.entities = useStore.getState().entities;
    return useStore.subscribe((s) => {
      bridge.entities = s.entities;
    });
  }, []);

  const buildItems = useCallback((query: string): SlashItem[] => {
    const q = query.trim();
    const entities = bridge.entities;

    // No query yet — offer the command vocabulary.
    if (!q) {
      return ENTITY_KINDS.map((k) => ({
        type: "kind" as const,
        slash: k.slash,
        label: k.plural,
        kind: k.kind,
      }));
    }

    // `/p`, `/c aeth`, … — a kind prefix optionally followed by a search term.
    const sorted = [...ENTITY_KINDS].sort(
      (a, b) => b.slash.length - a.slash.length,
    );
    const matchedKind = sorted.find(
      (k) => q === k.slash || q.toLowerCase().startsWith(`${k.slash} `),
    );

    if (matchedKind) {
      const term = q.slice(matchedKind.slash.length).trim().toLowerCase();
      const pool = entities.filter((e) => e.kind === matchedKind.kind);
      const hits = term
        ? pool.filter((e) => e.name.toLowerCase().includes(term))
        : pool;
      const items: SlashItem[] = hits.slice(0, 8).map((e) => ({
        type: "entity" as const,
        id: e.id,
        label: e.name,
        kind: e.kind,
      }));
      if (term && !hits.some((e) => e.name.toLowerCase() === term)) {
        items.push({
          type: "create",
          kind: matchedKind.kind,
          name: q.slice(matchedKind.slash.length).trim(),
          label: "create",
        });
      }
      return items;
    }

    // Free text — search everything, plus any command whose name matches.
    const lower = q.toLowerCase();
    const kinds: SlashItem[] = ENTITY_KINDS.filter(
      (k) =>
        k.slash.startsWith(lower) || k.plural.toLowerCase().startsWith(lower),
    ).map((k) => ({
      type: "kind" as const,
      slash: k.slash,
      label: k.plural,
      kind: k.kind,
    }));

    const hits: SlashItem[] = entities
      .filter((e) => e.name.toLowerCase().includes(lower))
      .slice(0, 8)
      .map((e) => ({
        type: "entity" as const,
        id: e.id,
        label: e.name,
        kind: e.kind,
      }));

    return [...hits, ...kinds];
  }, []);

  const suggestion = useMemo(
    () => ({
      char: "/",
      allowSpaces: true,
      items: ({ query }: { query: string }) => buildItems(query),
      render: () => {
        let latest: {
          items: SlashItem[];
          command: (p: { run: () => void }) => void;
          clientRect?: (() => DOMRect | null) | null;
          editor: { commands: Record<string, unknown> };
          query: string;
        } | null = null;

        const paint = () => {
          if (!latest) return;
          setMenu({
            items: latest.items,
            rect: latest.clientRect?.() ?? null,
            onSelect: (item) => select(item),
          });
        };

        const select = (item: SlashItem) => {
          if (!latest) return;
          const { command, editor } = latest;

          // `command` deletes the slash range first, which closes the
          // suggestion and clears `latest` — so hold the editor reference here
          // rather than reaching back through it inside the callback.
          const ed = editor as unknown as {
            commands: {
              insertContent: (s: string) => void;
              insertEntityRef: (a: {
                entityId: string;
                kind: string;
                label: string;
              }) => void;
            };
          };

          if (item.type === "kind") {
            // Picking a type just rewrites the query — one continuous flow.
            command({ run: () => ed.commands.insertContent(`/${item.slash} `) });
            return;
          }

          if (item.type === "create") {
            const id = useStore
              .getState()
              .addEntity({ name: item.name, kind: item.kind as EntityKind });
            command({
              run: () =>
                ed.commands.insertEntityRef({
                  entityId: id,
                  kind: item.kind,
                  label: item.name,
                }),
            });
            return;
          }

          command({
            run: () =>
              ed.commands.insertEntityRef({
                entityId: item.id,
                kind: item.kind,
                label: item.label,
              }),
          });
        };

        return {
          onStart: (props: unknown) => {
            latest = props as typeof latest;
            setActiveIndex(0);
            paint();
          },
          onUpdate: (props: unknown) => {
            latest = props as typeof latest;
            if (bridge.index >= (latest?.items.length ?? 0)) {
              setActiveIndex(0);
            }
            paint();
          },
          onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            const len = latest?.items.length ?? 0;
            if (event.key === "ArrowDown") {
              setActiveIndex(len ? (bridge.index + 1) % len : 0);
              paint();
              return true;
            }
            if (event.key === "ArrowUp") {
              setActiveIndex(len ? (bridge.index - 1 + len) % len : 0);
              paint();
              return true;
            }
            if (event.key === "Enter" || event.key === "Tab") {
              const item = latest?.items[bridge.index];
              if (item) {
                select(item);
                return true;
              }
              return false;
            }
            if (event.key === "Escape") {
              setMenu(null);
              return true;
            }
            return false;
          },
          onExit: () => {
            latest = null;
            setMenu(null);
          },
        };
      },
    }),
    [buildItems, setActiveIndex],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          link: { openOnClick: false, autolink: true },
        }),
        TextStyleKit,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Placeholder.configure({ placeholder: PLACEHOLDER }),
        CharacterCount,
        Subscript,
        Superscript,
        EntityRef,
        SlashCommand.configure({ suggestion }),
      ],
      content: (initialDoc as object) ?? undefined,
      editorProps: {
        attributes: {
          class: "ig-prose",
          spellcheck: "true",
        },
      },
      onUpdate: ({ editor: ed }) => onUpdate(ed.getJSON()),
    },
    [sceneId],
  );

  return { editor, menu, index, setIndex: setActiveIndex };
}
