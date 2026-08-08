"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Save, Undo2, Redo2, ChevronDown } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useStore } from "@/lib/store";
import { Commands } from "@/components/commands/Commands";
import { HelpSheet } from "./HelpSheet";
import { ProjectMenu } from "./ProjectMenu";

type History = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

type Chrome = {
  setHistory: (h: History | null) => void;
  history: History | null;
  toast: (msg: string) => void;
};

const ChromeCtx = createContext<Chrome | null>(null);

export function useChrome() {
  const ctx = useContext(ChromeCtx);
  if (!ctx) throw new Error("useChrome must be used inside AppShell");
  return ctx;
}

/** Register editor-level undo/redo with the global toolbar. */
export function useRegisterHistory(h: History | null) {
  const { setHistory } = useChrome();
  const { undo, redo, canUndo, canRedo } = h ?? {};
  useEffect(() => {
    if (!undo || !redo) {
      setHistory(null);
      return;
    }
    setHistory({ undo, redo, canUndo: !!canUndo, canRedo: !!canRedo });
    return () => setHistory(null);
  }, [setHistory, undo, redo, canUndo, canRedo]);
}

const TABS = [
  { href: "/", label: "Home" },
  { href: "/script", label: "Script" },
  { href: "/board", label: "Board" },
  { href: "/flow", label: "Flow" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [history, setHistory] = useState<History | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const markSaved = useStore((s) => s.markSaved);

  const toastTimer = useRef<number | undefined>(undefined);
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const value = useMemo<Chrome>(
    () => ({ history, setHistory, toast }),
    [history, toast],
  );

  const save = useCallback(() => {
    markSaved();
    toast("Project saved");
  }, [markSaved, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <ChromeCtx.Provider value={value}>
      <div className="flex h-dvh flex-col overflow-hidden bg-void">
        {/* ---- top bar ---- */}
        <header className="relative shrink-0 px-4 pt-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 text-dim">
              <IconBtn label="Save project" onClick={save}>
                <Save size={15} strokeWidth={1.7} />
              </IconBtn>
              <IconBtn
                label="Undo"
                disabled={!history?.canUndo}
                onClick={() => history?.undo()}
              >
                <Undo2 size={15} strokeWidth={1.7} />
              </IconBtn>
              <ChevronDown size={9} className="-ml-1.5 text-faint" />
              <IconBtn
                label="Redo"
                disabled={!history?.canRedo}
                onClick={() => history?.redo()}
              >
                <Redo2 size={15} strokeWidth={1.7} />
              </IconBtn>
              <button
                aria-label="Project menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="-ml-1.5 rounded p-0.5 text-faint transition-colors hover:text-ink"
              >
                <ChevronDown size={9} />
              </button>
            </div>

            <Link
              href="/"
              aria-label="INK &amp; GEARS — home"
              className="absolute left-1/2 top-1 -translate-x-1/2 text-ink transition-opacity hover:opacity-80"
            >
              <Wordmark height={36} />
            </Link>

            <button
              onClick={() => setHelpOpen(true)}
              className="text-[13px] text-ink/90 transition-colors hover:text-accent"
            >
              Help
            </button>
          </div>

          {/* ---- module tabs ---- */}
          <nav className="mt-1 flex items-center gap-4" aria-label="Modules">
            {TABS.map((t) => {
              const active = isActive(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "pb-0.5 text-[13.5px] transition-colors",
                    active
                      ? "text-ink underline decoration-1 underline-offset-4"
                      : "text-ink/85 hover:text-ink",
                  ].join(" ")}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {menuOpen && <ProjectMenu onClose={() => setMenuOpen(false)} />}
        </header>

        {/* ---- content panel ---- */}
        <main className="min-h-0 flex-1 px-2 pb-2 pt-1.5">
          <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-panel">
            {children}
          </div>
        </main>

        <Commands />
        {helpOpen && <HelpSheet onClose={() => setHelpOpen(false)} />}

        {toastMsg && (
          <div
            role="status"
            className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line2 bg-raise px-4 py-2 text-[12.5px] text-ink shadow-2xl"
          >
            {toastMsg}
          </div>
        )}
      </div>
    </ChromeCtx.Provider>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-0.5 transition-colors hover:text-ink disabled:cursor-default disabled:opacity-35 disabled:hover:text-dim"
    >
      {children}
    </button>
  );
}
