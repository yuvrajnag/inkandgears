"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";

export function cx(...v: (string | false | null | undefined)[]) {
  return v.filter(Boolean).join(" ");
}

/* ---------------- buttons ---------------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "accent", size = "md", className, ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";
  const sizes = {
    sm: "h-7 px-3 text-[15.6px]",
    md: "h-9 px-4 text-[16.9px]",
    lg: "h-11 px-5 text-[19.5px]",
  }[size];
  const variants = {
    accent:
      "bg-accent text-black hover:bg-accent-soft active:translate-y-px shadow-[0_0_24px_-8px_var(--ink-accent)]",
    ghost: "text-dim hover:bg-raise2 hover:text-ink",
    outline: "border border-line2 text-ink hover:border-accent/60 hover:bg-raise",
  }[variant];
  return (
    <button ref={ref} className={cx(base, sizes, variants, className)} {...rest} />
  );
});

/* ---------------- fields ---------------- */

const fieldBase =
  "ig-field w-full rounded-[10px] border-2 border-line2 bg-black px-3.5 text-[16px] font-bold text-ink outline-none transition-all placeholder:font-normal placeholder:text-faint sm:text-[21px]";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input ref={ref} className={cx(fieldBase, "h-[53px]", className)} {...rest} />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(
        fieldBase,
        "resize-y py-2.5 text-[15px] leading-relaxed sm:text-[17.7px]",
        className,
      )}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cx(fieldBase, "h-10 appearance-none pr-9", className)}
        {...rest}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 12 12"
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-dim"
      >
        <path
          d="M2 4.5 6 8.5 10 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    </div>
  );
});

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[16px] text-faint sm:text-[21px]">
      {children}
    </span>
  );
}

/* ---------------- chips ---------------- */

export function Chip({
  children,
  tone = "accent",
  onRemove,
  onClick,
  title,
}: {
  children: ReactNode;
  tone?: "accent" | "muted" | "ghost";
  onRemove?: () => void;
  onClick?: () => void;
  title?: string;
}) {
  const tones = {
    accent: "bg-accent text-black",
    muted: "bg-raise2 text-ink/90 border border-line2",
    ghost: "border border-dashed border-line2 text-dim hover:text-ink",
  }[tone];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      title={title}
      onClick={onClick}
      className={cx(
        "inline-flex max-w-full items-center gap-1 rounded-[5px] px-2 py-[3px] text-[13.7px] leading-tight transition-colors",
        tones,
        onClick && "cursor-pointer hover:opacity-85",
      )}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 shrink-0 opacity-60 transition-opacity hover:opacity-100"
        >
          <X size={13} />
        </button>
      )}
    </Tag>
  );
}

/* ---------------- fieldset with overlapping legend ---------------- */

export function Fieldset({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cx(
        "rounded-xl border border-line2 px-3 pb-3 pt-1",
        className,
      )}
    >
      <legend className="px-1.5 text-[16px] text-faint sm:text-[21px]">{legend}</legend>
      {children}
    </fieldset>
  );
}

/* ---------------- modal ---------------- */

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const nodes = ref.current.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input,textarea,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={ref}
        className={cx(
          "relative w-full overflow-hidden rounded-2xl border border-line2 bg-panel shadow-2xl",
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[18.2px] font-medium">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-dim transition-colors hover:bg-raise2 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- empty state ---------------- */

export function EmptyState({
  caption = "Nothing To See Here",
  children,
}: {
  caption?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 py-16 text-center">
      <Cactus />
      <div>
        <p className="font-script text-[44.2px] leading-none text-ink">
          {caption}
        </p>
        <svg
          viewBox="0 0 160 8"
          className="mx-auto mt-1.5 h-2 w-[150px] text-ink"
          aria-hidden
        >
          <path
            d="M4 5 C 44 1, 116 1, 156 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {children}
    </div>
  );
}

/** Hand-drawn desert scene for empty states. */
function Cactus() {
  return (
    <svg
      viewBox="0 0 280 180"
      className="h-auto w-[min(264px,72vw)] text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* trunk */}
      <path d="M92 156 V48 a13 13 0 0 1 26 0 v108" />
      {/* left arm, elbow down then reaching up */}
      <path d="M92 104 H74 a12 12 0 0 1 -12 -12 V66" />
      <path d="M62 66 a10 10 0 0 1 20 0 v14" />
      {/* right arm */}
      <path d="M118 88 h20 a12 12 0 0 0 12 -12 V52" />
      <path d="M150 52 a10 10 0 0 0 -20 0 v12" />
      {/* spines along the trunk */}
      {[60, 74, 88, 102, 116, 130, 144].map((y) => (
        <g key={y} strokeWidth="1.4">
          <path d={`M92 ${y} l-6 -4`} />
          <path d={`M118 ${y - 6} l6 -4`} />
        </g>
      ))}
      <g strokeWidth="1.4">
        <path d="M62 78 l-6 -4 M82 74 l6 -4" />
        <path d="M150 64 l6 -4 M130 60 l-6 -4" />
      </g>
      {/* tumbleweed */}
      <circle cx="205" cy="128" r="26" strokeWidth="2" />
      <g strokeWidth="1.2">
        <path d="M179 128 h52 M205 102 v52 M187 110 l36 36 M223 110 l-36 36" />
      </g>
      {/* grass tufts */}
      <g strokeWidth="2">
        <path d="M44 156 c1 -10 -2 -16 -6 -21 M50 156 c0 -13 2 -20 5 -26 M56 156 c2 -9 6 -14 11 -18" />
        <path d="M244 156 c1 -9 -1 -15 -5 -19 M250 156 c0 -12 2 -18 5 -23 M256 156 c2 -8 6 -13 10 -16" />
        <path d="M158 156 c0 -9 2 -14 5 -18 M166 156 c1 -11 4 -16 8 -20" />
      </g>
      {/* ground and pebbles */}
      <path
        d="M24 156 H272"
        strokeWidth="2"
        strokeDasharray="26 16 8 14 34 12"
      />
      <path d="M136 152 a7 5 0 0 1 14 0" strokeWidth="1.8" />
      <path d="M74 153 a5 4 0 0 1 10 0" strokeWidth="1.8" />
      <path d="M226 153 a5 4 0 0 1 10 0" strokeWidth="1.8" />
    </svg>
  );
}
