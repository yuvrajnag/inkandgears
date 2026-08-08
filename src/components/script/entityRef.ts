import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    entityRef: {
      insertEntityRef: (attrs: {
        entityId: string;
        kind: string;
        label: string;
      }) => ReturnType;
    };
  }
}

/**
 * An inline, atomic reference to a World Matrix entity.
 *
 * It reads as ordinary prose — just the name, lightly tinted — but carries the
 * entity id in the document, which is what lets appearances be derived instead
 * of maintained by hand.
 */
export const EntityRef = Node.create({
  name: "entityRef",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      entityId: { default: null },
      kind: { default: "character" },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-entity-id]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-entity-id": node.attrs.entityId,
        "data-kind": node.attrs.kind,
        class: "ig-entity",
      }),
      node.attrs.label,
    ];
  },

  renderText({ node }) {
    return node.attrs.label;
  },

  addCommands() {
    return {
      insertEntityRef:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: "text", text: " " },
          ]),
    };
  },
});
