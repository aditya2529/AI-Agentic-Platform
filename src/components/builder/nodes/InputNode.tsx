"use client";

import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InputNodeData } from "../types";

export function InputNode({ id, data }: NodeProps & { data: InputNodeData }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className="w-56 rounded-md border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Input
      </div>
      <div className="flex flex-col gap-1 p-3">
        <Label className="text-xs">Label</Label>
        <Input
          className="h-8 text-xs"
          value={data.label}
          onChange={(e) => updateNodeData(id, { label: e.target.value })}
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
