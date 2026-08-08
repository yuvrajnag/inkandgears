"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Copy, Trash2, Search, Maximize2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useIsCompact } from "@/lib/useMedia";
import { BoardBar } from "@/components/board/BoardBar";
import { Button, cx, EmptyState, Input } from "@/components/ui/primitives";
import { nodeTypes } from "./nodes";
import { useRegisterHistory } from "@/components/chrome/AppShell";
import type {
  Flow,
  FlowNodeData,
  StoredFlowEdge,
  StoredFlowNode,
} from "@/lib/types";

export function FlowCanvas() {
  const hydrated = useHydrated();
  const flowId = useSearchParams().get("id") ?? "";
  const flow = useStore((s) => s.flows.find((f) => f.id === flowId));

  if (!hydrated) return <div className="h-full" />;

  if (!flow) {
    return (
      <div className="flex h-full flex-col">
        <BoardBar
          crumbs={[{ label: "All", href: "/flow" }]}
          createHref="/flow/new"
        />
        <div className="flex-1">
          <EmptyState caption="Flow Not Found">
            <Link href="/flow">
              <Button variant="outline" size="sm">
                Back to Flow
              </Button>
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider key={flow.id}>
      <Canvas flow={flow} />
    </ReactFlowProvider>
  );
}

type Snapshot = { nodes: Node[]; edges: Edge[] };

function Canvas({ flow }: { flow: Flow }) {
  const saveFlowGraph = useStore((s) => s.saveFlowGraph);
  const compact = useIsCompact();

  // Seeded once per flow — the provider is keyed by id, so switching flows
  // remounts rather than re-syncing.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    flow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data as unknown as Record<string, unknown>,
    })),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    flow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
    })),
  );
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { fitView, screenToFlowPosition } = useReactFlow();

  /* ---- undo / redo ---- */
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const commit = useCallback(() => {
    const snap: Snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };
    setPast((p) => [...p.slice(-49), snap]);
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setFuture((f) => [...f, { nodes, edges }]);
    setPast((p) => p.slice(0, -1));
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = future[future.length - 1];
    if (!next) return;
    setPast((p) => [...p, { nodes, edges }]);
    setFuture((f) => f.slice(0, -1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  useRegisterHistory(
    useMemo(
      () => ({
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      }),
      [undo, redo, past.length, future.length],
    ),
  );

  /* ---- autosave ---- */
  useEffect(() => {
    const t = setTimeout(() => {
      const storedNodes: StoredFlowNode[] = nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "beat",
        position: n.position,
        data: n.data as unknown as FlowNodeData,
      }));
      const storedEdges: StoredFlowEdge[] = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: typeof e.label === "string" ? e.label : undefined,
      }));
      saveFlowGraph(flow.id, storedNodes, storedEdges);
    }, 600);
    return () => clearTimeout(t);
  }, [nodes, edges, flow.id, saveFlowGraph]);

  /* ---- in-place rename from the node component ---- */
  useEffect(() => {
    const onRename = (e: Event) => {
      const { id, label } = (e as CustomEvent<{ id: string; label: string }>)
        .detail;
      commit();
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
      );
    };
    window.addEventListener("ig:rename-node", onRename);
    return () => window.removeEventListener("ig:rename-node", onRename);
  }, [commit, setNodes]);

  const onConnect = useCallback(
    (c: Connection) => {
      commit();
      setEdges((eds) => addEdge({ ...c, id: `e${Date.now()}` }, eds));
    },
    [commit, setEdges],
  );

  const addNode = useCallback(() => {
    commit();
    const centre = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const id = `n${Date.now()}`;
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "beat",
        position: { x: centre.x - 75, y: centre.y - 20 },
        data: { label: "New node" },
        selected: true,
      },
    ]);
  }, [commit, screenToFlowPosition, setNodes]);

  const duplicateSelected = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (!selected.length) return;
    commit();
    setNodes((ns) => [
      ...ns.map((n) => ({ ...n, selected: false })),
      ...selected.map((n) => ({
        ...n,
        id: `n${Date.now()}${Math.round(Math.random() * 999)}`,
        position: { x: n.position.x + 40, y: n.position.y + 40 },
        selected: true,
      })),
    ]);
  }, [nodes, commit, setNodes]);

  const deleteSelected = useCallback(() => {
    const ids = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    const edgeIds = new Set(edges.filter((e) => e.selected).map((e) => e.id));
    if (!ids.size && !edgeIds.size) return;
    commit();
    setNodes((ns) => ns.filter((n) => !ids.has(n.id)));
    setEdges((es) =>
      es.filter(
        (e) => !edgeIds.has(e.id) && !ids.has(e.source) && !ids.has(e.target),
      ),
    );
  }, [nodes, edges, commit, setNodes, setEdges]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, duplicateSelected, undo, redo]);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes.filter((n) =>
      String((n.data as FlowNodeData).label ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [query, nodes]);

  return (
    <div className="flex h-full flex-col">
      <BoardBar
        crumbs={[{ label: "All", href: "/flow" }, { label: flow.name }]}
        createHref="/flow/new"
        trailing={<Maximize2 size={11} className="text-faint" />}
      />

      {/* ---- canvas toolbar ---- */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-2.5 py-2 sm:px-3">
        <Button size="sm" variant="outline" onClick={addNode}>
          <Plus size={12} /> Node
        </Button>
        <Button size="sm" variant="ghost" onClick={duplicateSelected}>
          <Copy size={12} /> Duplicate
        </Button>
        <Button size="sm" variant="ghost" onClick={deleteSelected}>
          <Trash2 size={12} /> Delete
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {searchOpen ? (
            <div className="relative">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setQuery("");
                    setSearchOpen(false);
                  }
                  if (e.key === "Enter" && matches[0]) {
                    fitView({ nodes: [matches[0]], duration: 400, padding: 2 });
                  }
                }}
                placeholder="Find a node…"
                className="h-7 w-56 text-[12px]"
              />
              {matches.length > 0 && (
                <div className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-lg border border-line2 bg-panel shadow-2xl">
                  {matches.slice(0, 6).map((n) => (
                    <button
                      key={n.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        fitView({ nodes: [n], duration: 400, padding: 2 });
                      }}
                      className="block w-full truncate px-3 py-1.5 text-left text-[12px] text-dim transition-colors hover:bg-raise2 hover:text-ink"
                    >
                      {String((n.data as FlowNodeData).label)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              aria-label="Search nodes"
              onClick={() => setSearchOpen(true)}
              className="rounded-md p-1.5 text-dim transition-colors hover:text-ink"
            >
              <Search size={14} />
            </button>
          )}
          <span className="hidden text-[11px] text-faint sm:inline">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={(c) => {
            // Only a finished drag is worth a restore point; undo/redo set
            // nodes directly and never come through here.
            if (c.some((x) => x.type === "position" && x.dragging === false)) {
              commit();
            }
            onNodesChange(c);
          }}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          proOptions={{ hideAttribution: true }}
          fitView
          // On a narrow screen a wide graph would otherwise shrink to
          // unreadable specks; stop zooming out and let the writer pan.
          fitViewOptions={{ padding: 0.2, minZoom: 0.45 }}
          minZoom={0.15}
          maxZoom={2.5}
          selectionOnDrag
          panOnScroll
          deleteKeyCode={null}
          className={cx("bg-void")}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1}
            color="#1e1e1e"
          />
          <Controls
            showInteractive={false}
            className="!rounded-lg !border !border-line !bg-panel !shadow-xl"
          />
          {!compact && (
            <MiniMap
              pannable
              zoomable
              bgColor="#070707"
              nodeColor="#232323"
              nodeStrokeColor="#3a3a3a"
              nodeBorderRadius={3}
              maskColor="rgba(0,0,0,.66)"
              maskStrokeColor="#2a2a2a"
              // clear of the Commands launcher in the corner
              style={{ right: 68, bottom: 12 }}
            />
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
