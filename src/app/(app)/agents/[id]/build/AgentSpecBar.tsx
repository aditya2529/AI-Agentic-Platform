"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDownIcon, Loader2, Pencil, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateSystemPrompt } from "./actions";

export type ToolBadge = { key: string; label: string };

export function AgentSpecBar({
  summary,
  tools,
  systemPrompt,
  updatedAt,
  streaming,
  agentId,
  onSystemPromptChange,
}: {
  summary: string;
  tools: ToolBadge[];
  systemPrompt: string;
  // Bumps whenever the spec changes — used to flash a brief highlight.
  updatedAt?: number;
  // True while a build stream is in flight.
  streaming?: boolean;
  // If provided, the system prompt panel becomes editable.
  agentId?: string;
  onSystemPromptChange?: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(systemPrompt);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // Flash the bar briefly whenever the spec updates from a streamed delta.
  useEffect(() => {
    if (!updatedAt) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [updatedAt]);

  // Keep the editor draft in sync when not actively editing (e.g. the AI
  // just streamed a new prompt — pick it up).
  useEffect(() => {
    if (!editing) setDraft(systemPrompt);
  }, [systemPrompt, editing]);

  function save() {
    if (!agentId) return;
    const trimmed = draft.trim();
    if (trimmed.length < 10) {
      setError("Instructions are too short.");
      return;
    }
    setError(null);
    onSystemPromptChange?.(trimmed);
    setEditing(false);
    startTransition(async () => {
      try {
        await updateSystemPrompt(agentId, trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save.");
      }
    });
  }

  const canEdit = Boolean(agentId);

  return (
    <div
      className={`relative border-b border-white/10 bg-card/30 backdrop-blur-xl transition-colors duration-500 ${
        flash ? "bg-card/50" : ""
      }`}
    >
      {/* Gradient hairline while streaming */}
      {streaming ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#a78bff] to-transparent animate-pulse"
        />
      ) : null}

      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Your agent
            {streaming ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/80" />
            ) : null}
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
            aria-controls="agent-spec-details"
          >
            {open ? "Hide details" : "View details"}
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open ? (
        <div id="agent-spec-details" className="border-t border-white/10 bg-background/40">
          <div className="mx-auto max-w-3xl px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Instructions
              </p>
              {canEdit ? (
                editing ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        setDraft(systemPrompt);
                        setError(null);
                      }}
                      disabled={pending}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                    <Button size="sm" onClick={save} disabled={pending}>
                      <Check className="h-3.5 w-3.5" />
                      {pending ? "Saving…" : "Save"}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-white/30 hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )
              ) : null}
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-card/40 p-5">
              {editing ? (
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-32 resize-y border-0 bg-transparent p-0 text-base leading-relaxed shadow-none focus-visible:ring-0"
                  placeholder="Write the instructions for your agent…"
                  autoFocus
                />
              ) : (
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {systemPrompt}
                </p>
              )}
              {error ? (
                <p className="mt-3 text-xs text-destructive">{error}</p>
              ) : null}
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
