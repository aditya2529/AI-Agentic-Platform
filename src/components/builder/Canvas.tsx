"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { AgentGraph } from "@/db/schema";
import { PROVIDER_MODELS } from "@/lib/providers";
import { saveAgentGraph } from "@/app/(app)/agents/actions";
import { LlmNode } from "./nodes/LlmNode";
import { ToolNode } from "./nodes/ToolNode";
import { InputNode } from "./nodes/InputNode";
import { OutputNode } from "./nodes/OutputNode";
import type { NodeKind } from "./types";

const nodeTypes: NodeTypes = {
  llm: LlmNode,
  tool: ToolNode,
  input: InputNode,
  output: OutputNode,
};

const DEFAULT_DATA: Record<NodeKind, Record<string, unknown>> = {
  llm: {
    provider: "anthropic",
    model: PROVIDER_MODELS.anthropic[0],
    systemPrompt: "You are a helpful assistant.",
  },
  tool: { toolName: "web_search" },
  input: { label: "User input" },
  output: { label: "Result" },
};

let nextId = 1;
const newId = () => `n_${Date.now()}_${nextId++}`;

function CanvasInner({ agentId, initialGraph }: { agentId: string; initialGraph: AgentGraph }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialGraph.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges as Edge[]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rfRef = useRef<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/agent-node-kind") as NodeKind;
      if (!kind) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const node: Node = {
        id: newId(),
        type: kind,
        position,
        data: { ...DEFAULT_DATA[kind] },
      };
      setNodes((nds) => nds.concat(node));
    },
    [screenToFlowPosition, setNodes],
  );

  // Debounced save when graph changes.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const graph: AgentGraph = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type as NodeKind,
          position: n.position,
          data: n.data as Record<string, unknown>,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        })),
      };
      void saveAgentGraph(agentId, graph);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges, agentId]);

  const memoNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="h-full w-full" ref={wrapperRef} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={memoNodeTypes}
        onInit={(inst) => (rfRef.current = inst)}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export function Canvas(props: { agentId: string; initialGraph: AgentGraph }) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
