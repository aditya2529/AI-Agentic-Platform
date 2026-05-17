"use client";

import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { builtInToolDefs, BUILT_IN_TOOL_NAMES, type BuiltInToolName } from "@/runtime/tools/registry";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ToolNodeData } from "../types";

export function ToolNode({ id, data }: NodeProps & { data: ToolNodeData }) {
  const { updateNodeData } = useReactFlow();
  const def = builtInToolDefs[data.toolName];

  return (
    <div className="w-64 rounded-md border bg-card text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Tool
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Tool</Label>
          <Select
            value={data.toolName}
            onValueChange={(v) => updateNodeData(id, { toolName: v as BuiltInToolName })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILT_IN_TOOL_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {builtInToolDefs[name].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{def?.description}</p>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
