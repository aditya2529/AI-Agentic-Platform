"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AssistantBubble,
  ErrorCard,
  PendingBubble,
  UserBubble,
} from "@/components/ChatBubbles";
import type { AgentSpec } from "@/db/schema";

type ChatItem =
  | { kind: "msg"; id: string; role: "user" | "assistant"; content: string }
  | { kind: "error"; id: string; message: string; lastUserText: string };

type StreamEvent =
  | { type: "partial"; value: PartialRefine }
  | { type: "final"; value: FinalRefine }
  | { type: "error"; message: string };

type PartialRefine = {
  updatedSpec?: Partial<AgentSpec>;
  name?: string;
  assistantReply?: string;
};

type FinalRefine = {
  updatedSpec: AgentSpec;
  name: string;
  assistantReply: string;
};

export function BuildChat({
  agentId,
  initialMessages,
  onSpecChange,
  onNameChange,
  onStreamingChange,
}: {
  agentId: string;
  initialMessages: { id: string; role: "user" | "assistant"; content: string }[];
  onSpecChange: (next: Partial<AgentSpec>) => void;
  onNameChange: (next: string) => void;
  onStreamingChange: (streaming: boolean) => void;
}) {
  const [items, setItems] = useState<ChatItem[]>(
    initialMessages.map((m) => ({ kind: "msg" as const, id: m.id, role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, streaming]);

  useEffect(() => {
    onStreamingChange(streaming);
  }, [streaming, onStreamingChange]);

  const send = useCallback(
    async (text: string) => {
      if (!text || streaming) return;
      setInput("");

      const userId = `u-${Date.now()}`;
      const assistantId = `a-${Date.now()}`;

      // Optimistic user bubble + empty assistant bubble.
      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "error"),
        { kind: "msg", id: userId, role: "user", content: text },
        { kind: "msg", id: assistantId, role: "assistant", content: "" },
      ]);
      setStreaming(true);

      try {
        const res = await fetch(`/api/agents/${agentId}/build`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
          setItems((prev) => [
            ...prev.filter((i) => !(i.kind === "msg" && i.id === assistantId)),
            { kind: "error", id: `err-${Date.now()}`, message: errText, lastUserText: text },
          ]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Split on newlines — incomplete tail stays in buffer.
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let evt: StreamEvent | null = null;
            try {
              evt = JSON.parse(line) as StreamEvent;
            } catch {
              continue;
            }

            if (evt.type === "partial") {
              const v = evt.value;
              if (v.updatedSpec) onSpecChange(v.updatedSpec);
              if (v.name) onNameChange(v.name);
              if (typeof v.assistantReply === "string") {
                const reply = v.assistantReply;
                setItems((prev) =>
                  prev.map((it) =>
                    it.kind === "msg" && it.id === assistantId
                      ? { ...it, content: reply }
                      : it,
                  ),
                );
              }
            } else if (evt.type === "final") {
              const v = evt.value;
              onSpecChange(v.updatedSpec);
              onNameChange(v.name);
              setItems((prev) =>
                prev.map((it) =>
                  it.kind === "msg" && it.id === assistantId
                    ? { ...it, content: v.assistantReply }
                    : it,
                ),
              );
            } else if (evt.type === "error") {
              setItems((prev) => [
                ...prev.filter((i) => !(i.kind === "msg" && i.id === assistantId)),
                {
                  kind: "error",
                  id: `err-${Date.now()}`,
                  message: evt.message,
                  lastUserText: text,
                },
              ]);
            }
          }
        }
      } catch (err) {
        setItems((prev) => [
          ...prev.filter((i) => !(i.kind === "msg" && i.id === assistantId)),
          {
            kind: "error",
            id: `err-${Date.now()}`,
            message: err instanceof Error ? err.message : String(err),
            lastUserText: text,
          },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [agentId, streaming, onSpecChange, onNameChange],
  );

  // Find the streaming assistant bubble (if any) so we can render a pending
  // indicator when it's empty, and the real text once tokens arrive.
  const lastAssistant = [...items].reverse().find(
    (i): i is Extract<ChatItem, { kind: "msg" }> => i.kind === "msg" && i.role === "assistant",
  );
  const showPending = streaming && lastAssistant !== undefined && !lastAssistant.content;

  return (
    <div className="relative flex h-full flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 overflow-y-auto px-6 py-8">
        {items.length === 0 ? (
          <AssistantBubble>
            Describe what your agent should do. I&apos;ll set it up for you and you can refine
            it from there.
          </AssistantBubble>
        ) : null}

        {items.map((item) => {
          if (item.kind === "error") {
            return (
              <ErrorCard
                key={item.id}
                message={item.message}
                onRetry={() => send(item.lastUserText)}
              />
            );
          }
          if (item.role === "user") {
            return <UserBubble key={item.id}>{item.content}</UserBubble>;
          }
          // Hide empty assistant bubble while streaming — PendingBubble shows instead.
          if (streaming && !item.content && item.id === lastAssistant?.id) return null;
          return <AssistantBubble key={item.id}>{item.content}</AssistantBubble>;
        })}

        {showPending ? <PendingBubble label="Refining your agent…" /> : null}

        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 bg-background/60 px-6 py-5 backdrop-blur-2xl">
        <div className="mx-auto max-w-3xl">
          <div className="glow-hover flex items-end gap-2 rounded-2xl border border-white/15 bg-card/40 p-2 backdrop-blur-xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input.trim());
                }
              }}
              placeholder="Refine your agent — e.g. 'make it more formal'"
              className="min-h-12 resize-none border-0 bg-transparent px-3 py-3 text-base leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
              disabled={streaming}
            />
            <Button
              onClick={() => send(input.trim())}
              disabled={streaming || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-white text-black transition hover:bg-white/90 hover:scale-[1.05] disabled:scale-100"
              aria-label="Send (Enter)"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <CornerDownLeft className="h-3 w-3" /> to send
            <span className="mx-1.5 opacity-40">·</span>
            Shift + Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
