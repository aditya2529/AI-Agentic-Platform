"use client";

import { LayersIcon, MessageSquareIcon, ArrowRightToLineIcon, WrenchIcon } from "lucide-react";
import type { NodeKind } from "./types";

const ITEMS: { kind: NodeKind; label: string; Icon: React.ComponentType<{ className?: string }> }[] =
  [
    { kind: "input", label: "Input", Icon: ArrowRightToLineIcon },
    { kind: "llm", label: "LLM", Icon: MessageSquareIcon },
    { kind: "tool", label: "Tool", Icon: WrenchIcon },
    { kind: "output", label: "Output", Icon: LayersIcon },
  ];

export function Palette() {
  return (
    <aside className="flex w-44 shrink-0 flex-col gap-2 border-r p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Nodes
      </div>
      {ITEMS.map(({ kind, label, Icon }) => (
        <div
          key={kind}
          className="flex cursor-grab items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent active:cursor-grabbing"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/agent-node-kind", kind);
            e.dataTransfer.effectAllowed = "move";
          }}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
      ))}
      <p className="mt-2 text-xs text-muted-foreground">Drag onto canvas. Wire handles to connect.</p>
    </aside>
  );
}
