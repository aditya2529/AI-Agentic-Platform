"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { AgentSpec } from "@/db/schema";
import { AgentSpecBar, type ToolBadge } from "./AgentSpecBar";
import { BuildChat } from "./BuildChat";
import { AgentNameEditor } from "./AgentNameEditor";

const TOOL_LABELS: Record<AgentSpec["tools"][number], string> = {
  http_fetch: "HTTP Fetch",
  web_search: "Web Search",
  calculator: "Calculator",
};

function toolBadgesFor(tools: AgentSpec["tools"]): ToolBadge[] {
  return tools.map((t) => ({ key: t, label: TOOL_LABELS[t] }));
}

type InitialMessage = { id: string; role: "user" | "assistant"; content: string };

export function BuildView({
  agentId,
  initialName,
  initialSpec,
  initialMessages,
}: {
  agentId: string;
  initialName: string;
  initialSpec: AgentSpec;
  initialMessages: InitialMessage[];
}) {
  const [name, setName] = useState(initialName);
  const [spec, setSpec] = useState<AgentSpec>(initialSpec);
  // Bumps each time the spec changes so the bar can briefly highlight.
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  // True while the stream is in flight — the bar shows a subtle gradient pulse.
  const [streaming, setStreaming] = useState(false);

  const handleSpecChange = useCallback((next: Partial<AgentSpec>) => {
    setSpec((prev) => ({
      ...prev,
      ...(next.systemPrompt !== undefined ? { systemPrompt: next.systemPrompt } : {}),
      ...(next.tools !== undefined ? { tools: next.tools } : {}),
      ...(next.summary !== undefined ? { summary: next.summary } : {}),
    }));
    setUpdatedAt(Date.now());
  }, []);

  const handleNameChange = useCallback((next: string) => {
    setName(next);
  }, []);

  const canTest = Boolean(spec.summary);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg -z-10" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between gap-4 border-b border-white/10 bg-background/60 px-6 py-4 backdrop-blur-2xl sm:px-8">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/agents"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back
          </Link>
          <div className="h-5 w-px shrink-0 bg-white/10" />
          <AgentNameEditor agentId={agentId} name={name} onChange={handleNameChange} />
        </div>
        {canTest ? (
          <Link
            href={`/agents/${agentId}/run`}
            className="group inline-flex h-11 shrink-0 items-center rounded-full bg-white px-5 text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.03]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Test agent
          </Link>
        ) : (
          <button
            disabled
            title="Describe your agent first"
            className="inline-flex h-11 shrink-0 cursor-not-allowed items-center rounded-full border border-white/10 px-5 text-base font-medium text-muted-foreground/60"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Test agent
          </button>
        )}
      </div>

      <AgentSpecBar
        agentId={agentId}
        summary={spec.summary}
        tools={toolBadgesFor(spec.tools)}
        systemPrompt={spec.systemPrompt}
        updatedAt={updatedAt}
        streaming={streaming}
        onSystemPromptChange={(next) => handleSpecChange({ systemPrompt: next })}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <BuildChat
          agentId={agentId}
          initialMessages={initialMessages}
          onSpecChange={handleSpecChange}
          onNameChange={handleNameChange}
          onStreamingChange={setStreaming}
        />
      </div>
    </div>
  );
}
