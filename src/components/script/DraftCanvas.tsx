"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { useStore, countWords, docToText } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useDraftEditor } from "./useDraftEditor";
import { SlashMenu } from "./SlashMenu";
import { Toolbar } from "./Toolbar";
import { SceneTree } from "./SceneTree";
import { SceneMeta } from "./SceneMeta";
import { VersionHistory } from "./VersionHistory";
import { ManuscriptSearch } from "./ManuscriptSearch";
import { useRegisterHistory } from "@/components/chrome/AppShell";
import { cx, EmptyState, Button } from "@/components/ui/primitives";

const WORDS_PER_PAGE = 275;
const WORDS_PER_MINUTE = 230;

export function DraftCanvas() {
  const hydrated = useHydrated();

  const scenes = useStore((s) => s.scenes);
  const chapters = useStore((s) => s.chapters);
  const volumes = useStore((s) => s.volumes);
  const activeSceneId = useStore((s) => s.activeSceneId);
  const updateScene = useStore((s) => s.updateScene);
  const addScene = useStore((s) => s.addScene);
  const addChapter = useStore((s) => s.addChapter);
  const snapshot = useStore((s) => s.snapshot);
  const focusMode = useStore((s) => s.focusMode);
  const simpleMode = useStore((s) => s.simpleMode);
  const markSaved = useStore((s) => s.markSaved);

  const scene = useMemo(
    () => scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null,
    [scenes, activeSceneId],
  );

  const [treeOpen, setTreeOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");

  /* ---- autosave: debounce writes, snapshot occasionally ---- */
  const saveTimer = useRef<number | undefined>(undefined);
  const sinceSnapshot = useRef(0);

  const onUpdate = useCallback(
    (doc: unknown) => {
      if (!scene) return;
      setSaving("saving");
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        updateScene(scene.id, { doc, words: countWords(doc) });
        markSaved();
        setSaving("saved");
        sinceSnapshot.current += 1;
        // A restore point every so often, so a bad stretch is recoverable.
        if (sinceSnapshot.current >= 12) {
          sinceSnapshot.current = 0;
          snapshot("scene", scene.id, scene.title, doc);
        }
      }, 700);
    },
    [scene, updateScene, markSaved, snapshot],
  );

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  useEffect(() => {
    if (saving !== "saved") return;
    const t = setTimeout(() => setSaving("idle"), 1600);
    return () => clearTimeout(t);
  }, [saving]);

  const { editor, menu, index, setIndex } = useDraftEditor({
    sceneId: scene?.id ?? "none",
    initialDoc: scene?.doc,
    onUpdate,
  });

  useRegisterHistory(
    useMemo(
      () =>
        editor
          ? {
              undo: () => editor.chain().focus().undo().run(),
              redo: () => editor.chain().focus().redo().run(),
              canUndo: editor.can().undo(),
              canRedo: editor.can().redo(),
            }
          : null,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [editor, scene?.id, editor?.state],
    ),
  );

  /* ---- live statistics ---- */
  const stats = useMemo(() => {
    const text = editor ? editor.getText() : scene ? docToText(scene.doc) : "";
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.replace(/\s/g, "").length;
    const sentences = trimmed
      ? trimmed.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim()).length
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n+/).filter((p) => p.trim()).length
      : 0;
    return {
      words,
      characters,
      sentences,
      paragraphs,
      pages: Math.max(1, Math.ceil(words / WORDS_PER_PAGE)),
      readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    };
    // editor.state changes on every keystroke, which is exactly when stats move
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor?.state, scene, editor]);

  const newScene = useCallback(() => {
    const chapterId = scene?.chapterId ?? chapters[0]?.id;
    if (chapterId) {
      addScene(chapterId);
    } else {
      const volumeId = volumes[0]?.id;
      if (volumeId) addScene(addChapter(volumeId));
    }
  }, [scene, chapters, volumes, addScene, addChapter]);

  if (!hydrated) return <div className="h-full" />;

  if (!scene) {
    return (
      <div className="grid h-full place-items-center">
        <EmptyState caption="Nothing To Write On">
          <Button onClick={newScene}>Create the first scene</Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        editor={editor}
        scene={scene}
        chapters={chapters}
        scenes={scenes}
        stats={stats}
        onOpenManage={() => setTreeOpen(true)}
        onOpenMeta={() => setMetaOpen(true)}
        onOpenVersions={() => setVersionsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onNewScene={newScene}
      />

      <div className="flex min-h-0 flex-1">
        {treeOpen && <SceneTree onClose={() => setTreeOpen(false)} />}

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div
            className={cx(
              // Left-aligned measure, not centred — the writing starts where
              // the panel starts, the way the reference sets it.
              "w-full px-4 pb-32 pt-6 sm:px-8 sm:pt-8",
              simpleMode ? "mx-auto max-w-[720px]" : "max-w-[900px]",
              focusMode && "ig-focus",
            )}
          >
            {!simpleMode && (
              <input
                value={scene.title}
                onChange={(e) =>
                  updateScene(scene.id, { title: e.target.value })
                }
                aria-label="Scene title"
                className="mb-5 w-full bg-transparent font-display text-[20px] font-bold outline-none placeholder:text-faint focus:text-accent-soft sm:text-[24px]"
                placeholder="Untitled scene"
              />
            )}
            <EditorContent editor={editor} />
          </div>

          {/* save indicator */}
          <div
            aria-live="polite"
            className={cx(
              "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 text-[11px] transition-opacity",
              saving === "idle" ? "opacity-0" : "opacity-100",
              saving === "saving" ? "text-faint" : "text-dim",
            )}
          >
            {saving === "saving" ? "Saving…" : "Saved"}
          </div>
        </div>
      </div>

      <SlashMenu state={menu} index={index} setIndex={setIndex} />

      {metaOpen && (
        <SceneMeta scene={scene} onClose={() => setMetaOpen(false)} />
      )}
      {versionsOpen && (
        <VersionHistory
          sceneId={scene.id}
          onClose={() => setVersionsOpen(false)}
        />
      )}
      {searchOpen && <ManuscriptSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
