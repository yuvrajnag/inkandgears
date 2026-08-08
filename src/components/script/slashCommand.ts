import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";

export const slashPluginKey = new PluginKey("igSlash");

export type SlashItem =
  | { type: "kind"; slash: string; label: string; kind: string }
  | {
      type: "entity";
      id: string;
      label: string;
      kind: string;
      hint?: string;
    }
  | { type: "create"; label: string; kind: string; name: string };

/**
 * The `/p`, `/c`, … entity picker.
 *
 * Matching is done over the whole slash query so `/p aeth` narrows straight to
 * places called "aeth…" — one keystroke path from thought to reference.
 */
export const SlashCommand = Extension.create<{
  suggestion: Omit<SuggestionOptions, "editor">;
}>({
  name: "igSlashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        pluginKey: slashPluginKey,
        allowSpaces: true,
        startOfLine: false,
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          (props as { run?: () => void }).run?.();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
