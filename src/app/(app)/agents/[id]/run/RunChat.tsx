"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

export function RunChat({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantId = `a-${Date.now()}`;
    const history = [...messages, userMsg];
    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
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
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `Error: ${errText}` } : m)),
        );
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : String(err)}` }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-card/40 p-8 text-base text-muted-foreground backdrop-blur-xl">
            <p className="text-lg font-semibold text-foreground">Say something to your agent.</p>
            <p className="mt-3 text-base">
              It will respond based on the instructions you set up in the designer.
            </p>
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
              {m.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}
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
              placeholder="Ask your agent something…"
              className="min-h-14 resize-none border-0 bg-transparent px-3 text-base leading-relaxed shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
              disabled={streaming}
            />
            <Button
              onClick={send}
              disabled={streaming || !input.trim()}
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
