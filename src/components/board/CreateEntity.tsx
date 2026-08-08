"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUp, X, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { BoardBar } from "./BoardBar";
import {
  Button,
  Chip,
  cx,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { ENTITY_KINDS, type Detail, type EntityKind } from "@/lib/types";
import { readImageFile } from "@/lib/upload";
import type { EntityImage } from "@/lib/types";
import { routes } from "@/lib/routes";

export function CreateEntity() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const boards = useStore((s) => s.boards);
  const addEntity = useStore((s) => s.addEntity);
  const addBoard = useStore((s) => s.addBoard);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<EntityKind>("character");
  const [boardId, setBoardId] = useState(params.get("board") ?? "");
  const [images, setImages] = useState<EntityImage[]>([]);
  const [details, setDetails] = useState<Omit<Detail, "id">[]>([]);
  const [dragging, setDragging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dLabel, setDLabel] = useState("");
  const [dValue, setDValue] = useState("");
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  async function ingest(files: FileList | File[] | null) {
    if (!files) return;
    const next: EntityImage[] = [];
    for (const f of Array.from(files)) {
      const img = await readImageFile(f);
      if (img) next.push(img);
    }
    setImages((prev) => [...prev, ...next]);
  }

  function save() {
    setTouched(true);
    const trimmed = name.trim();
    if (!trimmed) {
      nameRef.current?.focus();
      return;
    }
    let target = boardId;
    if (boardId === "__new") {
      const label = prompt("Name the new board")?.trim();
      if (!label) return;
      target = addBoard(label);
    }
    const id = addEntity({
      name: trimmed,
      kind,
      boardId: target || null,
      description: description.trim(),
      images,
      details: details.map((d, i) => ({ ...d, id: `d${i}${Date.now()}` })),
    });
    router.push(routes.entity(id));
  }

  if (!hydrated) return <div className="h-full" />;

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[{ label: "All", href: "/board" }, { label: "new" }]}
        createLabel="Create"
        onCreate={save}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-6 sm:px-8 lg:px-14"><div className="mx-auto max-w-[880px]">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          {/* ---------- left: upload ---------- */}
          <div className="order-2 md:order-1">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                ingest(e.dataTransfer.files);
              }}
              className={cx(
                "grid aspect-[4/3] max-h-[46vh] place-items-center rounded-2xl border bg-raise transition-colors sm:aspect-square sm:max-h-none",
                dragging
                  ? "border-accent bg-accent/5"
                  : "border-transparent hover:border-line2",
              )}
            >
              {images.length === 0 ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-4 px-8 text-center"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border-[1.6px] border-ink/85">
                    <ArrowUp size={29} strokeWidth={1.8} />
                  </span>
                  <span className="max-w-[190px] text-[16.2px] leading-relaxed text-ink/90">
                    Choose a file or drag and drop it here
                  </span>
                </button>
              ) : (
                <div className="grid h-full w-full grid-cols-2 gap-2 overflow-y-auto p-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-line"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.name ?? ""}
                        className="h-full w-full object-cover"
                      />
                      <button
                        aria-label="Remove image"
                        onClick={() =>
                          setImages((p) => p.filter((x) => x.id !== img.id))
                        }
                        className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white group-hover:block"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileRef.current?.click()}
                    aria-label="Add more images"
                    className="grid aspect-square place-items-center rounded-lg border border-dashed border-line2 text-faint transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    <Plus size={23} />
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  ingest(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <Button
              size="lg"
              className="mt-5 w-full text-[22.1px] font-semibold"
              onClick={save}
            >
              Save
            </Button>
          </div>

          {/* ---------- right: fields ---------- */}
          <div className="order-1 space-y-4 md:order-2">
            <div>
              <Label>Name</Label>
              <Input
                ref={nameRef}
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                aria-invalid={touched && !name.trim()}
              />
              {touched && !name.trim() && (
                <p className="mt-1.5 text-[15px] text-red-300">
                  Give it a name first.
                </p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tag</Label>
                <Select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as EntityKind)}
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
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                >
                  <option value="">No board</option>
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                  <option value="__new">+ New board…</option>
                </Select>
              </div>
            </div>

            <div>
              <Label>Details</Label>
              <div className="min-h-[120px] rounded-[10px] border border-line2 bg-raise p-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {details.map((d, i) => (
                    <Chip
                      key={`${d.label}-${i}`}
                      onRemove={() =>
                        setDetails((p) => p.filter((_, j) => j !== i))
                      }
                    >
                      {d.label ? `${d.label} — ${d.value}` : d.value}
                    </Chip>
                  ))}
                  {!adding && (
                    <Chip tone="ghost" onClick={() => setAdding(true)}>
                      Add +
                    </Chip>
                  )}
                </div>

                {adding && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      autoFocus
                      value={dLabel}
                      onChange={(e) => setDLabel(e.target.value)}
                      placeholder="Field"
                      className="h-8 w-[110px] text-[15.6px]"
                    />
                    <Input
                      value={dValue}
                      onChange={(e) => setDValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && dValue.trim()) {
                          setDetails((p) => [
                            ...p,
                            {
                              label: dLabel.trim(),
                              value: dValue.trim(),
                              type: "text",
                            },
                          ]);
                          setDLabel("");
                          setDValue("");
                        }
                      }}
                      placeholder="Value"
                      className="h-8 min-w-[120px] flex-1 text-[15.6px]"
                    />
                    <Button
                      size="sm"
                      disabled={!dValue.trim()}
                      onClick={() => {
                        setDetails((p) => [
                          ...p,
                          {
                            label: dLabel.trim(),
                            value: dValue.trim(),
                            type: "text",
                          },
                        ]);
                        setDLabel("");
                        setDValue("");
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAdding(false)}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
