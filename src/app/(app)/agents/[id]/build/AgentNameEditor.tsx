"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { renameAgent } from "@/app/(app)/agents/actions";

export function AgentNameEditor({
  agentId,
  name,
  onChange,
}: {
  agentId: string;
  name: string;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync if the upstream name changes (e.g. AI just renamed
  // the agent during a streaming refine).
  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setDraft(name);
      setError(null);
      return;
    }
    if (trimmed.length > 80) {
      setError("Name is too long.");
      return;
    }
    setError(null);
    onChange(trimmed);
    setEditing(false);
    startTransition(async () => {
      try {
        await renameAgent(agentId, trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save.");
        onChange(name); // revert
      }
    });
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
    setError(null);
  }

  if (editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          onBlur={commit}
          maxLength={80}
          aria-label="Agent name"
          className="min-w-0 max-w-[20rem] rounded-md border border-white/15 bg-background/60 px-2 py-1 text-xl font-semibold tracking-tight text-foreground outline-none focus:border-white/40"
        />
        {error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left transition hover:bg-white/[0.04]"
      aria-label="Rename agent"
      title="Click to rename"
      disabled={pending}
    >
      <span className="truncate text-xl font-semibold tracking-tight text-foreground">
        {name}
      </span>
      <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition group-hover:text-muted-foreground" />
    </button>
  );
}
