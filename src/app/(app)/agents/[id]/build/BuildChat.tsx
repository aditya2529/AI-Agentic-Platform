"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AssistantBubble,
  ErrorCard,
  PendingBubble,
  UserBubble,
} from "@/components/ChatBubbles";
import { sendBuildMessage } from "./actions";

type ChatItem =
  | { kind: "msg"; id: string; role: "user" | "assistant"; content: string }
  | { kind: "error"; id: string; message: string; lastUserText: string };

export function BuildChat({
  agentId,
  initialMessages,
}: {
  agentId: string;
  initialMessages: { id: string; role: "user" | "assistant"; content: string }[];
}) {
  const [items, setItems] = useState<ChatItem[]>(
    initialMessages.map((m) => ({ kind: "msg" as const, id: m.id, role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, pending]);

  function send(text: string) {
    if (!text || pending) return;
    setInput("");
    setItems((prev) => [
      ...prev.filter((i) => i.kind !== "error"),
      { kind: "msg", id: `tmp-${Date.now()}`, role: "user", content: text },
    ]);
    startTransition(async () => {
      try {
        await sendBuildMessage(agentId, text);
        router.refresh();
      } catch (err) {
        setItems((prev) => [
          ...prev,
          {
            kind: "error",
            id: `err-${Date.now()}`,
            message: err instanceof Error ? err.message : String(err),
            lastUserText: text,
          },
        ]);
      }
    });
  }

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
          return item.role === "user" ? (
            <UserBubble key={item.id}>{item.content}</UserBubble>
          ) : (
            <AssistantBubble key={item.id}>{item.content}</AssistantBubble>
          );
        })}

        {pending ? <PendingBubble label="Refining your agent…" /> : null}

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
              disabled={pending}
            />
            <Button
              onClick={() => send(input.trim())}
              disabled={pending || !input.trim()}
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
