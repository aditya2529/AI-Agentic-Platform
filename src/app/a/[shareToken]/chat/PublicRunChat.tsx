"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, CornerDownLeft, MessageSquarePlus } from "lucide-react";
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

const storageKey = (token: string) => `agentic:public:${token}`;

export function PublicRunChat({
  shareToken,
  agentName,
}: {
  shareToken: string;
  agentName: string;
}) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(shareToken));
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed)) {
          setItems(parsed.map((msg) => ({ kind: "msg", msg })));
        }
      }
    } catch {
      // ignore
    }
  }, [shareToken]);

  useEffect(() => {
    const msgs = items.flatMap((i) => (i.kind === "msg" ? [i.msg] : []));
    try {
      localStorage.setItem(storageKey(shareToken), JSON.stringify(msgs));
    } catch {
      // ignore
    }
  }, [items, shareToken]);

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

      const historyMsgs = items.flatMap((i) => (i.kind === "msg" ? [i.msg] : []));
      const history = [...historyMsgs, userMsg];

      setItems((prev) => [
        ...prev.filter((i) => i.kind !== "error"),
        { kind: "msg", msg: userMsg },
        { kind: "msg", msg: assistantMsg },
      ]);
      setStreaming(true);

      try {
        const res = await fetch(`/api/share/${shareToken}/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
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
    [shareToken, items, streaming],
  );

  function newChat() {
    setItems([]);
    try {
      localStorage.removeItem(storageKey(shareToken));
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
            Send a message to chat with {agentName}. Your conversation stays in your browser.
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
              placeholder={`Send a message to ${agentName}…`}
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
            Powered by <span className="text-gradient">Agentic</span>
          </p>
        </div>
      </div>
    </div>
  );
}
