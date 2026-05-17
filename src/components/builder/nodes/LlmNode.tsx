"use client";

import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import { PROVIDERS, PROVIDER_LABELS, PROVIDER_MODELS, type Provider } from "@/lib/providers";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LlmNodeData } from "../types";

export function LlmNode({ id, data }: NodeProps & { data: LlmNodeData }) {
  const { updateNodeData } = useReactFlow();
  const provider = data.provider;
  const models = PROVIDER_MODELS[provider] ?? [];

  return (
    <div className="w-72 rounded-md border bg-card text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Left} />
      <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        LLM
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Provider</Label>
          <Select
            value={provider}
            onValueChange={(v) =>
              updateNodeData(id, {
                provider: v as Provider,
                model: PROVIDER_MODELS[v as Provider][0],
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">Model</Label>
          <Select value={data.model} onValueChange={(v) => updateNodeData(id, { model: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">System prompt</Label>
          <Textarea
            className="min-h-20 text-xs"
            value={data.systemPrompt}
            onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant…"
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
