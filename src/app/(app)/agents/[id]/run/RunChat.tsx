"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AssistantBubble,
  ErrorCard,
  UserBubble,
} from "@/components/ChatBubbles";

type Msg = { id: string; role: "user" | "assistant"; content: string };
type ChatItem =
  | { kind: "msg"; msg: Msg }
  | { kind: "error"; id: string; message: string; lastUserText: string };

const storageKey = (agentId: string) => `agentic:run:${agentId}`;

export function RunChat({ agentId }: { agentId: string }) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(agentId));
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed)) {
          setItems(parsed.map((msg) => ({ kind: "msg", msg })));
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, [agentId]);

  // Persist only successful messages (not errors)
  useEffect(() => {
    const msgs = items.flatMap((i) => (i.kind === "msg" ? [i.msg] : []));
    try {
      localStorage.setItem(storageKey(agentId), JSON.stringify(msgs));
    } catch {
      // quota etc.
    }
  }, [items, agentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, streaming]);

  const send = useCallback(
    async (text: string) => {
      if (!text || streaming) return;
      setInput("");

      const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content: text };
      const assistantId = `a-${Date.now()}`;
      const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "" };

      // Build history from current messages + new user msg (excluding any errors)
      const historyMsgs = items.flatMap((i) => (i.kind === "msg" ? [i.msg] : []));
      const history = [...historyMsgs, userMsg];

      // Drop any pending error, add user + empty assistant
      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "error"),
        { kind: "msg", msg: userMsg },
        { kind: "msg", msg: assistantMsg },
      ]);
      setStreaming(true);

      try {
        const res = await fetch(`/api/agents/${agentId}/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
          // Remove the empty assistant bubble, append error card
          setItems((prev) => [
            ...prev.filter((i) => !(i.kind === "msg" && i.msg.id === assistantId)),
            { kind: "error", id: `err-${Date.now()}`, message: errText, lastUserText: text },
          ]);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setItems((prev) =>
            prev.map((i) =>
              i.kind === "msg" && i.msg.id === assistantId
                ? { kind: "msg", msg: { ...i.msg, content: acc } }
                : i,
            ),
          );
        }
      } catch (err) {
        setItems((prev) => [
          ...prev.filter((i) => !(i.kind === "msg" && i.msg.id === assistantId)),
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
    [agentId, items, streaming],
  );

  function newChat() {
    setItems([]);
    try {
      localStorage.removeItem(storageKey(agentId));
    } catch {
      // ignore
    }
  }

  const hasMessages = items.some((i) => i.kind === "msg");

  return (
    <div className="relative flex h-full flex-col">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-4">
        {hasMessages ? (
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-white/25 hover:text-foreground"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" /> New chat
          </button>
        ) : <span />}
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {items.length === 0 ? (
          <AssistantBubble>
            Send a message to test your agent. Your conversation stays here even if you refresh.
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
          const m = item.msg;
          return m.role === "user" ? (
            <UserBubble key={m.id}>{m.content}</UserBubble>
          ) : (
            <AssistantBubble key={m.id}>{m.content || (streaming ? "…" : "")}</AssistantBubble>
          );
        })}

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
              placeholder="Send a message to test your agent…"
              className="min-h-12 resize-none border-0 bg-transparent px-3 py-3 text-base leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
              disabled={streaming}
            />
            <Button
              onClick={() => send(input.trim())}
              disabled={streaming || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-white text-black transition hover:bg-white/90 hover:scale-[1.05] disabled:scale-100"
              aria-label="Send"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
