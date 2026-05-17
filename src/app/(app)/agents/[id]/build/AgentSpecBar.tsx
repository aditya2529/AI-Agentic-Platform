"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AgentSpecBar({
  summary,
  tools,
  systemPrompt,
}: {
  summary: string;
  tools: { key: string; label: string }[];
  systemPrompt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-b border-white/10 bg-card/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-8 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Your agent
          </p>
          <p className="mt-1 truncate text-lg font-medium leading-snug text-foreground">
            {summary || "Tell me what to build."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden flex-wrap gap-2 sm:flex">
            {tools.length === 0 ? (
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                No tools yet
              </span>
            ) : (
              tools.map((t) => (
                <Badge key={t.key} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  {t.label}
                </Badge>
              ))
            )}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-medium text-muted-foreground transition hover:border-white/30 hover:text-foreground"
            aria-expanded={open}
          >
            {open ? "Hide details" : "View details"}
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-background/40">
          <div className="mx-auto max-w-5xl px-8 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Instructions
            </p>
            <div className="mt-3 rounded-2xl border border-white/10 bg-card/40 p-5">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                {systemPrompt}
              </p>
            </div>
            {tools.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2 sm:hidden">
                {tools.map((t) => (
                  <Badge key={t.key} variant="secondary" className="rounded-full px-3 py-1">
                    {t.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
