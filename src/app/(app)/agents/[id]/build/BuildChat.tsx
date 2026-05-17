"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendBuildMessage } from "./actions";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function BuildChat({
  agentId,
  initialMessages,
}: {
  agentId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "user", content: text },
    ]);
    startTransition(async () => {
      try {
        await sendBuildMessage(agentId, text);
        router.refresh();
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
          },
        ]);
      }
    });
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-card/40 p-8 text-base text-muted-foreground backdrop-blur-xl">
            <p className="text-lg font-semibold text-foreground">Describe your agent.</p>
            <ul className="mt-4 space-y-2 text-base">
              <li>· &ldquo;An agent that researches a company and summarizes recent news about it.&rdquo;</li>
              <li>· &ldquo;A math tutor that walks me through solving equations step by step.&rdquo;</li>
              <li>· &ldquo;A bot that fetches a webpage and gives me the key takeaways.&rdquo;</li>
            </ul>
          </div>
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-3xl px-6 py-4 text-lg leading-relaxed shadow-lg ${
                m.role === "user"
                  ? "bg-white text-black"
                  : "border border-white/10 bg-card/60 text-foreground backdrop-blur-xl"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-card/60 px-6 py-4 text-base text-muted-foreground backdrop-blur-xl">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Updating your agent…
            </div>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 bg-background/60 px-8 py-5 backdrop-blur-2xl">
        <div className="mx-auto max-w-3xl">
          <div className="glow-hover flex items-end gap-3 rounded-2xl border border-white/15 bg-card/40 p-3 backdrop-blur-xl">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Tell me what this agent should do…"
              className="min-h-14 resize-none border-0 bg-transparent px-3 text-base leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
              disabled={pending}
            />
            <Button
              onClick={send}
              disabled={pending || !input.trim()}
              className="h-12 rounded-full bg-white px-6 text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.03] disabled:scale-100"
            >
              Send
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}
