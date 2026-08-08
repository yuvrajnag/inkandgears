"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Check,
  ImageOff,
  Trash2,
} from "lucide-react";
import { useStore, appearancesFor, readingOrder } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "./BoardBar";
import {
  Button,
  Chip,
  cx,
  EmptyState,
  Fieldset,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { ENTITY_KINDS, type Detail, type FieldType } from "@/lib/types";
import { readImageFile } from "@/lib/upload";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function EntitySheet({ entityId }: { entityId: string }) {
  const hydrated = useHydrated();
  const router = useRouter();

  const entity = useStore((s) => s.entities.find((e) => e.id === entityId));
  const boards = useStore((s) => s.boards);
  const scenes = useStore((s) => s.scenes);
  const chapters = useStore((s) => s.chapters);
  const relationships = useStore((s) => s.relationships);
  const entities = useStore((s) => s.entities);

  const updateEntity = useStore((s) => s.updateEntity);
  const addEntityImage = useStore((s) => s.addEntityImage);
  const removeEntityImage = useStore((s) => s.removeEntityImage);
  const setCover = useStore((s) => s.setCover);
  const addDetail = useStore((s) => s.addDetail);
  const removeDetail = useStore((s) => s.removeDetail);
  const removeEntity = useStore((s) => s.removeEntity);
  const addRelationship = useStore((s) => s.addRelationship);
  const removeRelationship = useStore((s) => s.removeRelationship);
  const setActiveScene = useStore((s) => s.setActiveScene);

  const [slide, setSlide] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Appearances are derived from the script, never stored. */
  const appearances = useMemo(() => {
    if (!entity) return [];
    const ordered = readingOrder(scenes, chapters);
    return appearancesFor(entity.id, ordered);
  }, [entity, scenes, chapters]);

  const related = useMemo(() => {
    if (!entity) return [];
    return relationships
      .filter((r) => r.fromId === entity.id || r.toId === entity.id)
      .map((r) => {
        const outgoing = r.fromId === entity.id;
        const other = entities.find(
          (e) => e.id === (outgoing ? r.toId : r.fromId),
        );
        return { r, other, outgoing };
      })
      .filter((x) => x.other);
  }, [entity, relationships, entities]);

  if (!hydrated) return <div className="h-full" />;

  if (!entity) {
    return (
      <div className="flex h-full flex-col">
        <BoardBar crumbs={[{ label: "All", href: "/board" }]} createHref="/board/new" />
        <div className="flex-1">
          <EmptyState caption="Not Found Here">
            <Link href="/board">
              <Button variant="outline" size="sm">
                Back to Board
              </Button>
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const board = boards.find((b) => b.id === entity.boardId);
  const images = entity.images;
  const current = images[Math.min(slide, Math.max(0, images.length - 1))];
  const kindLabel =
    ENTITY_KINDS.find((k) => k.kind === entity.kind)?.label ?? entity.kind;

  const go = (dir: -1 | 1) => {
    if (images.length < 2) return;
    setSlide((s) => (s + dir + images.length) % images.length);
  };

  async function onFiles(files: FileList | null) {
    if (!files || !entity) return;
    for (const file of Array.from(files)) {
      const img = await readImageFile(file);
      if (img) addEntityImage(entity.id, img);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[
          { label: "All", href: "/board" },
          board
            ? { label: board.name.toLowerCase(), href: `/board/c/${board.id}` }
            : { label: kindLabel.toLowerCase() },
          { label: entity.name },
        ]}
        createHref="/board/new"
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-3.5">
        {/* ---- title row ---- */}
        <div className="mb-4 flex items-center gap-4">
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="text-dim transition-colors hover:text-ink"
          >
            <ArrowLeft size={21} strokeWidth={1.8} />
          </button>
          <input
            value={entity.name}
            onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
            aria-label="Entity name"
            className="min-w-0 flex-1 bg-transparent font-display text-[27px] font-bold leading-none outline-none focus:text-accent-soft"
          />
          <button
            aria-label="Entity settings"
            onClick={() => setSettingsOpen(true)}
            className="text-dim transition-colors hover:text-ink"
          >
            <Settings size={18} strokeWidth={1.6} />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* ---------- left: gallery ---------- */}
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-raise">
              <div className="aspect-[16/9]">
                {current ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.src}
                    alt={`${entity.name} — reference ${slide + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="grid h-full w-full place-items-center gap-2 text-faint transition-colors hover:text-dim"
                  >
                    <ImageOff size={26} strokeWidth={1.4} />
                    <span className="text-[12px]">Add a reference image</span>
                  </button>
                )}
              </div>

              {images.length > 1 && (
                <>
                  <CarouselBtn side="left" onClick={() => go(-1)} />
                  <CarouselBtn side="right" onClick={() => go(1)} />
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
                    {images.map((img, i) => (
                      <button
                        key={img.id}
                        aria-label={`Go to image ${i + 1}`}
                        onClick={() => setSlide(i)}
                        className={cx(
                          "h-[3px] rounded-full transition-all",
                          i === slide
                            ? "w-6 bg-white/90"
                            : "w-3 bg-white/30 hover:bg-white/50",
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ---- thumbnails ---- */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
              {images.map((img, i) => (
                <div key={img.id} className="group relative">
                  <button
                    onClick={() => {
                      setSlide(i);
                      setCover(entity.id, i);
                    }}
                    aria-label={`Reference ${i + 1}${i === entity.coverIndex ? " (cover)" : ""}`}
                    className={cx(
                      "relative h-[38px] w-[38px] overflow-hidden rounded-lg border-2 transition-all",
                      i === slide
                        ? "border-accent"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {i === entity.coverIndex && (
                      <span className="absolute inset-0 grid place-items-center bg-black/45">
                        <Check size={14} className="text-accent" />
                      </span>
                    )}
                  </button>
                  <button
                    aria-label="Remove image"
                    onClick={() => {
                      removeEntityImage(entity.id, img.id);
                      setSlide(0);
                    }}
                    className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-void p-0.5 text-faint transition-colors hover:text-red-400 group-hover:block"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              <button
                aria-label="Add reference image"
                onClick={() => fileRef.current?.click()}
                className="grid h-[38px] w-[38px] place-items-center rounded-lg border border-dashed border-line2 text-faint transition-colors hover:border-accent/60 hover:text-accent"
              >
                <Plus size={15} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {/* ---- appeared in ---- */}
            <Fieldset legend="Appeared in:" className="mt-5 min-h-[76px]">
              {appearances.length === 0 ? (
                <p className="pt-1.5 text-[11.5px] text-faint">
                  Nothing yet. Reference this{" "}
                  {kindLabel.toLowerCase()} with{" "}
                  <code className="font-mono text-dim">
                    /
                    {ENTITY_KINDS.find((k) => k.kind === entity.kind)?.slash ??
                      "c"}
                  </code>{" "}
                  while writing and its scenes will collect here on their own.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {appearances.map((sc) => (
                    <Chip
                      key={sc.id}
                      onClick={() => {
                        setActiveScene(sc.id);
                        router.push("/script");
                      }}
                      title={`Open ${sc.title}`}
                    >
                      {sc.title}
                    </Chip>
                  ))}
                </div>
              )}
            </Fieldset>

            {appearances.length > 0 && (
              <p className="mt-2 px-1 text-[11px] text-faint">
                First in {appearances[0].title} · last in{" "}
                {appearances[appearances.length - 1].title} ·{" "}
                {appearances.length}{" "}
                {appearances.length === 1 ? "scene" : "scenes"} across{" "}
                {new Set(appearances.map((s) => s.chapterId)).size} chapter
                {new Set(appearances.map((s) => s.chapterId)).size === 1
                  ? ""
                  : "s"}
              </p>
            )}
          </div>

          {/* ---------- right: fields ---------- */}
          <div className="space-y-3.5">
            <div>
              <Label>Name</Label>
              <Input
                value={entity.name}
                onChange={(e) =>
                  updateEntity(entity.id, { name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={entity.description}
                onChange={(e) =>
                  updateEntity(entity.id, { description: e.target.value })
                }
                placeholder="Who or what is this, in the shape the story needs it?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tag</Label>
                <Select
                  value={entity.kind}
                  onChange={(e) =>
                    updateEntity(entity.id, {
                      kind: e.target.value as typeof entity.kind,
                    })
                  }
                >
                  {ENTITY_KINDS.map((k) => (
                    <option key={k.kind} value={k.kind}>
                      {k.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Board</Label>
                <Select
                  value={entity.boardId ?? ""}
                  onChange={(e) =>
                    updateEntity(entity.id, {
                      boardId: e.target.value || null,
                    })
                  }
                >
                  <option value="">No board</option>
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>Details</Label>
              <div className="min-h-[110px] rounded-[10px] border border-line2 bg-raise p-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {entity.details.map((d) => (
                    <DetailChip
                      key={d.id}
                      detail={d}
                      onRemove={() => removeDetail(entity.id, d.id)}
                    />
                  ))}
                  <Chip tone="ghost" onClick={() => setDetailOpen(true)}>
                    Add +
                  </Chip>
                </div>
              </div>
            </div>

            <div>
              <Label>Relationships</Label>
              <div className="min-h-[64px] rounded-[10px] border border-line2 bg-raise p-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {related.map(({ r, other, outgoing }) => (
                    <Chip
                      key={r.id}
                      tone="muted"
                      onRemove={() => removeRelationship(r.id)}
                      onClick={() => router.push(`/board/e/${other!.id}`)}
                    >
                      {outgoing ? `${r.kind} → ` : `← ${r.kind} `}
                      {other!.name}
                    </Chip>
                  ))}
                  <RelationshipAdder
                    entityId={entity.id}
                    onAdd={(toId, kind) =>
                      addRelationship({ fromId: entity.id, toId, kind })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {detailOpen && (
        <DetailModal
          onClose={() => setDetailOpen(false)}
          kind={entity.kind}
          onAdd={(d) => {
            addDetail(entity.id, d);
            setDetailOpen(false);
          }}
        />
      )}

      {settingsOpen && (
        <Modal title="Entity settings" onClose={() => setSettingsOpen(false)}>
          <div className="space-y-4 text-[13px]">
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={5}
                value={entity.notes}
                onChange={(e) =>
                  updateEntity(entity.id, { notes: e.target.value })
                }
                placeholder="Anything that shouldn't show on the sheet."
              />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-[12px] text-dim">
              <div>
                <dt className="text-faint">Created</dt>
                <dd>{new Date(entity.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-faint">Updated</dt>
                <dd>{new Date(entity.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="border-t border-line pt-4">
              <Button
                variant="outline"
                className="border-red-500/40 text-red-300 hover:border-red-500 hover:bg-red-500/10"
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${entity.name}"? References already written into scenes will stay as plain text.`,
                    )
                  ) {
                    removeEntity(entity.id);
                    router.push("/board");
                  }
                }}
              >
                <Trash2 size={13} /> Delete entity
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CarouselBtn({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      aria-label={side === "left" ? "Previous image" : "Next image"}
      onClick={onClick}
      className={cx(
        "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full",
        "bg-black/35 text-white/90 backdrop-blur-sm transition-all hover:bg-black/60 hover:text-white",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon size={22} strokeWidth={2} />
    </button>
  );
}

/** A colour detail renders as its own swatch; everything else as "label — value". */
function DetailChip({
  detail,
  onRemove,
}: {
  detail: Detail;
  onRemove: () => void;
}) {
  if (detail.type === "color" && HEX.test(detail.value)) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[10.5px] font-medium text-black/85"
        style={{ background: detail.value }}
      >
        {detail.value.toUpperCase()}
        <button
          aria-label="Remove detail"
          onClick={onRemove}
          className="opacity-60 hover:opacity-100"
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <Chip tone="accent" onRemove={onRemove}>
      {detail.label ? `${detail.label} — ${detail.value}` : detail.value}
    </Chip>
  );
}

const SUGGESTED: Record<string, string[]> = {
  character: [
    "Age",
    "Role",
    "Origin",
    "Alignment",
    "Trait",
    "Occupation",
    "Ability",
    "Weakness",
    "Goal",
    "Fear",
    "Status",
    "Affiliation",
  ],
  location: [
    "Climate",
    "Region",
    "Population",
    "Culture",
    "Architecture",
    "Terrain",
    "Landmark",
    "Ruler",
    "Economy",
    "Defense",
    "Religion",
    "History",
  ],
};

function DetailModal({
  onClose,
  onAdd,
  kind,
}: {
  onClose: () => void;
  onAdd: (d: Omit<Detail, "id">) => void;
  kind: string;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<FieldType>("text");

  const suggestions = SUGGESTED[kind] ?? [];

  return (
    <Modal title="Add detail" onClose={onClose}>
      <div className="space-y-4">
        {suggestions.length > 0 && (
          <div>
            <Label>Common for this type</Label>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setLabel(s)}
                  className={cx(
                    "rounded-md border px-2 py-1 text-[11.5px] transition-colors",
                    label === s
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-line2 text-dim hover:text-ink",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div>
            <Label>Field</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Climate  (leave empty for a plain tag)"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
            >
              {(
                [
                  "text",
                  "number",
                  "boolean",
                  "select",
                  "multi",
                  "date",
                  "color",
                  "ref",
                ] as FieldType[]
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Value</Label>
          {type === "color" ? (
            <div className="flex gap-2">
              <input
                type="color"
                value={HEX.test(value) ? value : "#1bb4f0"}
                onChange={(e) => setValue(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-[10px] border border-line2 bg-raise p-1"
              />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="#E397CB"
              />
            </div>
          ) : type === "boolean" ? (
            <Select value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">—</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Select>
          ) : (
            <Input
              type={type === "number" ? "number" : type === "date" ? "date" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Mild breezes, soft sunlight, drifting clouds"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!value.trim()}
            onClick={() =>
              onAdd({ label: label.trim(), value: value.trim(), type })
            }
          >
            Add detail
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const REL_KINDS = [
  "lives in",
  "belongs to",
  "knows",
  "owned by",
  "takes place in",
  "involves",
  "rules",
  "allied with",
  "enemy of",
] as const;

function RelationshipAdder({
  entityId,
  onAdd,
}: {
  entityId: string;
  onAdd: (toId: string, kind: (typeof REL_KINDS)[number]) => void;
}) {
  const entities = useStore((s) => s.entities);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof REL_KINDS)[number]>("knows");
  const [toId, setToId] = useState("");

  const options = entities.filter((e) => e.id !== entityId);

  if (!open) {
    return (
      <Chip tone="ghost" onClick={() => setOpen(true)}>
        Add +
      </Chip>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 pt-1">
      <Select
        value={kind}
        onChange={(e) => setKind(e.target.value as (typeof REL_KINDS)[number])}
        className="h-8 w-[130px] text-[11.5px]"
      >
        {REL_KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </Select>
      <Select
        value={toId}
        onChange={(e) => setToId(e.target.value)}
        className="h-8 min-w-[130px] flex-1 text-[11.5px]"
      >
        <option value="">Choose…</option>
        {options.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </Select>
      <Button
        size="sm"
        disabled={!toId}
        onClick={() => {
          onAdd(toId, kind);
          setToId("");
          setOpen(false);
        }}
      >
        Add
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
