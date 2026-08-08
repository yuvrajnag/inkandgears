"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Pilcrow,
  Subscript,
  Superscript,
  CaseSensitive,
  Highlighter,
  Baseline,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Bookmark,
  MessageSquarePlus,
  Search,
  History,
  FilePlus2,
  Maximize2,
  BookMarked,
  Share2,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cx } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
import { useIsCompact } from "@/lib/useMedia";
import type { Chapter, Scene } from "@/lib/types";

const FONTS = [
  { label: "Default", value: "" },
  { label: "Sans", value: "var(--font-sans-stack)" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "var(--font-mono-stack)" },
  { label: "Display", value: "var(--font-display-stack)" },
];

const SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px"];

export type ToolbarProps = {
  editor: Editor | null;
  scene: Scene | null;
  chapters: Chapter[];
  scenes: Scene[];
  stats: {
    words: number;
    characters: number;
    sentences: number;
    paragraphs: number;
    pages: number;
    readingMinutes: number;
  };
  onOpenManage: () => void;
  onOpenMeta: () => void;
  onOpenVersions: () => void;
  onOpenSearch: () => void;
  onNewScene: () => void;
};

export function Toolbar({
  editor,
  scene,
  chapters,
  scenes,
  stats,
  onOpenManage,
  onOpenMeta,
  onOpenVersions,
  onOpenSearch,
  onNewScene,
}: ToolbarProps) {
  const simpleMode = useStore((s) => s.simpleMode);
  const setSimpleMode = useStore((s) => s.setSimpleMode);
  const focusMode = useStore((s) => s.focusMode);
  const setFocusMode = useStore((s) => s.setFocusMode);
  const setActiveScene = useStore((s) => s.setActiveScene);
  const updateScene = useStore((s) => s.updateScene);

  const compact = useIsCompact();
  const [statsOpen, setStatsOpen] = useState(true);
  const [, force] = useState(0);

  // Mark state lives in ProseMirror, not React — repaint on every transaction.
  useEffect(() => {
    if (!editor) return;
    const bump = () => force((n) => n + 1);
    editor.on("transaction", bump);
    editor.on("selectionUpdate", bump);
    return () => {
      editor.off("transaction", bump);
      editor.off("selectionUpdate", bump);
    };
  }, [editor]);

  const chapter = chapters.find((c) => c.id === scene?.chapterId);
  const chapterScenes = scenes
    .filter((s) => s.chapterId === chapter?.id)
    .sort((a, b) => a.order - b.order);

  /*
   * Below a laptop there is no honest way to fit six tool groups, and 19px
   * hit targets are unusable with a thumb. Narrow screens get the same
   * toolbar Simple Mode uses, with the scene picker kept alongside it.
   */
  if (simpleMode || compact) {
    return (
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line px-3 py-2">
        <Tool
          label="Bold"
          active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={20} />
        </Tool>
        <Tool
          label="Italic"
          active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={20} />
        </Tool>
        <Tool
          label="Underline"
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline size={20} />
        </Tool>
        <Tool
          label="Bullet list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={20} />
        </Tool>
        <Tool
          label="Quote"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={20} />
        </Tool>

        <Divider />
        <Tool label="Chapters and scenes" onClick={onOpenManage}>
          <BookMarked size={20} />
        </Tool>
        <Tool label="Scene notes and metadata" onClick={onOpenMeta}>
          <MessageSquarePlus size={20} />
        </Tool>
        <Tool label="Search the manuscript" onClick={onOpenSearch}>
          <Search size={20} />
        </Tool>
        <Tool label="New scene" onClick={onNewScene}>
          <FilePlus2 size={20} />
        </Tool>

        <span className="flex shrink-0 items-center gap-2.5 pl-3 text-[14.3px] text-faint lg:ml-auto">
          <span className="whitespace-nowrap">{stats.words} words</span>
          {!compact && (
            <button
              onClick={() => setSimpleMode(false)}
              className="whitespace-nowrap rounded-md border border-line2 px-2 py-1 text-[14.3px] text-dim transition-colors hover:text-ink"
            >
              Advanced mode
            </button>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-stretch justify-between gap-0 overflow-x-auto border-b border-line px-2 py-1.5">
      {/* ---------------- style ---------------- */}
      <Group label="Style">
        <Row>
          <Field
            title="Font"
            value={editor?.getAttributes("textStyle").fontFamily ?? ""}
            onChange={(v) =>
              v
                ? editor?.chain().focus().setFontFamily(v).run()
                : editor?.chain().focus().unsetFontFamily().run()
            }
            options={FONTS}
            width="w-[132px]"
            placeholder="Font"
          />
          <Field
            title="Size"
            value={editor?.getAttributes("textStyle").fontSize ?? ""}
            onChange={(v) =>
              v
                ? editor?.chain().focus().setFontSize(v).run()
                : editor?.chain().focus().unsetFontSize().run()
            }
            options={[
              { label: "Size", value: "" },
              ...SIZES.map((s) => ({ label: s.replace("px", ""), value: s })),
            ]}
            width="w-[74px]"
            placeholder="Size"
          />
          <Tool
            label="Heading"
            active={editor?.isActive("heading", { level: 2 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <CaseSensitive size={18} />
          </Tool>
          <ColorTool
            label="Highlight"
            icon={<Highlighter size={17} />}
            value={editor?.getAttributes("textStyle").backgroundColor ?? "#1bb4f0"}
            onChange={(c) =>
              editor?.chain().focus().setBackgroundColor(c).run()
            }
            onClear={() => editor?.chain().focus().unsetBackgroundColor().run()}
          />
          <ColorTool
            label="Text colour"
            icon={<Baseline size={17} />}
            value={editor?.getAttributes("textStyle").color ?? "#ededed"}
            onChange={(c) => editor?.chain().focus().setColor(c).run()}
            onClear={() => editor?.chain().focus().unsetColor().run()}
          />
          <Tool
            label="Link"
            active={editor?.isActive("link")}
            onClick={() => {
              if (!editor) return;
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const href = prompt("Link to")?.trim();
              if (href) editor.chain().focus().setLink({ href }).run();
            }}
          >
            <Link2 size={17} />
          </Tool>
        </Row>
        <Row>
          <Tool
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold size={17} />
          </Tool>
          <Tool
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic size={17} />
          </Tool>
          <Tool
            label="Underline"
            active={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <Underline size={17} />
          </Tool>
          <Tool
            label="Strikethrough"
            active={editor?.isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={17} />
          </Tool>
          <Tool
            label="Clear formatting"
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <Pilcrow size={17} />
          </Tool>
          <Tool
            label="Subscript"
            active={editor?.isActive("subscript")}
            onClick={() => editor?.chain().focus().toggleSubscript().run()}
          >
            <Subscript size={17} />
          </Tool>
          <Tool
            label="Superscript"
            active={editor?.isActive("superscript")}
            onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          >
            <Superscript size={17} />
          </Tool>
        </Row>
      </Group>

      <Divider />

      {/* ---------------- layout ---------------- */}
      <Group label="Layout">
        <Row>
          {(
            [
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
              ["justify", AlignJustify],
            ] as const
          ).map(([align, Icon]) => (
            <Tool
              key={align}
              label={`Align ${align}`}
              active={editor?.isActive({ textAlign: align })}
              onClick={() => editor?.chain().focus().setTextAlign(align).run()}
            >
              <Icon size={17} />
            </Tool>
          ))}
          <Tool
            label="Horizontal rule"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={17} />
          </Tool>
        </Row>
        <Row>
          <Tool
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={17} />
          </Tool>
          <Tool
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={17} />
          </Tool>
          <Tool
            label="Quote"
            active={editor?.isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={17} />
          </Tool>
        </Row>
      </Group>

      <Divider />

      {/* ---------------- statistics ---------------- */}
      <Group
        label={
          <button
            onClick={() => setStatsOpen((v) => !v)}
            className="flex items-center gap-0.5 transition-colors hover:text-dim"
          >
            Statistics
            <ChevronDown
              size={12}
              className={cx("transition-transform", !statsOpen && "-rotate-90")}
            />
          </button>
        }
      >
        {statsOpen ? (
          <>
            <Row>
              <Stat label="Words" value={stats.words} />
              <Stat label="Sentences" value={stats.sentences} />
              <Stat label="Pages" value={stats.pages} />
            </Row>
            <Row>
              <Stat label="Characters" value={stats.characters} />
              <Stat label="Paragraphs" value={stats.paragraphs} />
            </Row>
          </>
        ) : (
          <Row>
            <Stat label="Words" value={stats.words} />
          </Row>
        )}
      </Group>

      <Divider />

      {/* ---------------- chapter / scene ---------------- */}
      <Group label="">
        <Row>
          <select
            aria-label="Chapter"
            value={chapter?.id ?? ""}
            onChange={(e) => {
              const first = scenes
                .filter((s) => s.chapterId === e.target.value)
                .sort((a, b) => a.order - b.order)[0];
              if (first) setActiveScene(first.id);
            }}
            className="h-[19px] w-[150px] rounded border border-line2 bg-void px-1.5 text-[13.7px] text-ink outline-none"
          >
            {chapters
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </Row>
        <Row>
          <select
            aria-label="Scene"
            value={scene?.id ?? ""}
            onChange={(e) => setActiveScene(e.target.value)}
            className="h-[19px] w-[150px] rounded border border-line2 bg-void px-1.5 text-[13.7px] text-ink outline-none"
          >
            {chapterScenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <Tool
            label={
              scene?.status === "final" ? "Marked final" : "Mark scene final"
            }
            active={scene?.status === "final"}
            onClick={() =>
              scene &&
              updateScene(scene.id, {
                status: scene.status === "final" ? "draft" : "final",
              })
            }
          >
            <Bookmark
              size={16}
              fill={scene?.status === "final" ? "currentColor" : "none"}
            />
          </Tool>
        </Row>
      </Group>

      <Divider />

      {/* ---------------- manage ---------------- */}
      <Group label="Manage" align="center">
        <Row>
          <Tool label="Scene notes and metadata" onClick={onOpenMeta}>
            <MessageSquarePlus size={17} />
          </Tool>
          <Tool label="Search the manuscript" onClick={onOpenSearch}>
            <Search size={17} />
          </Tool>
          <Tool label="Version history" onClick={onOpenVersions}>
            <History size={17} />
          </Tool>
          <Tool label="New scene" onClick={onNewScene}>
            <FilePlus2 size={17} />
          </Tool>
        </Row>
        <Row>
          <span className="pl-0.5 text-[11.7px] leading-none text-faint">
            Comment
          </span>
        </Row>
      </Group>

      <Divider />

      {/* ---------------- tools ---------------- */}
      <Group label="Tools" align="center">
        <Row>
          <Tool
            label={focusMode ? "Leave focus mode" : "Focus mode"}
            active={focusMode}
            onClick={() => setFocusMode(!focusMode)}
          >
            <Maximize2 size={17} />
          </Tool>
          <Tool label="Chapters and scenes" onClick={onOpenManage}>
            <BookMarked size={17} />
          </Tool>
          <Tool
            label="Copy scene text"
            onClick={() => {
              if (editor) navigator.clipboard?.writeText(editor.getText());
            }}
          >
            <Share2 size={17} />
          </Tool>
          <span
            aria-hidden
            title="You"
            className="ml-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full bg-accent text-[11px] font-semibold text-black"
          >
            Y
          </span>
          <Tool label="Simple mode" onClick={() => setSimpleMode(true)}>
            <Settings size={17} />
          </Tool>
        </Row>
        <Row>
          <span className="h-[9px]" />
        </Row>
      </Group>
    </div>
  );
}

/* ---------------- pieces ---------------- */

function Group({
  label,
  children,
  align = "end",
}: {
  label: ReactNode;
  children: ReactNode;
  align?: "end" | "center";
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1 px-2">
      {children}
      {label !== "" && (
        <span
          className={cx(
            "text-[11.7px] leading-none text-faint",
            align === "end" ? "text-right" : "text-center",
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-0.5 w-px shrink-0 self-stretch bg-line" />;
}

function Tool({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cx(
        "grid h-[19px] w-[19px] shrink-0 place-items-center rounded transition-colors",
        "max-lg:h-8 max-lg:w-8",
        active ? "bg-accent/15 text-accent" : "text-dim hover:bg-raise2 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Field({
  title,
  value,
  onChange,
  options,
  width,
  placeholder,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  width: string;
  placeholder: string;
}) {
  return (
    <select
      aria-label={title}
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "h-[19px] rounded border border-line2 bg-void px-1 text-[13.7px] text-ink outline-none",
        width,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.value === "" ? placeholder : o.label}
        </option>
      ))}
    </select>
  );
}

function ColorTool({
  label,
  icon,
  value,
  onChange,
  onClear,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (c: string) => void;
  onClear: () => void;
}) {
  return (
    <span className="relative inline-grid h-[19px] w-[19px] place-items-center rounded text-dim transition-colors hover:bg-raise2 hover:text-ink">
      <span aria-hidden>{icon}</span>
      <input
        type="color"
        aria-label={label}
        title={`${label} — double-click to clear`}
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#1bb4f0"}
        onChange={(e) => onChange(e.target.value)}
        onDoubleClick={onClear}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="whitespace-nowrap pr-2.5 text-[13px] text-dim">
      {label} : <span className="text-ink">{value}</span>
    </span>
  );
}
