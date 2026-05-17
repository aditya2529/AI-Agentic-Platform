"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, PenLine, Lightbulb, GraduationCap, Link as LinkIcon, Mail, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAgent } from "./actions";

const EXAMPLES = [
  { Icon: PenLine, label: "LinkedIn post writer", prompt: "An agent that writes catchy LinkedIn posts from a topic I give it." },
  { Icon: Lightbulb, label: "Side-hustle ideas", prompt: "An agent that brainstorms side-hustle business ideas tailored to my skills." },
  { Icon: GraduationCap, label: "Math tutor", prompt: "A math tutor that walks me through problems step by step." },
  { Icon: LinkIcon, label: "URL summarizer", prompt: "A bot that summarizes any URL I send it in 3 bullet points." },
  { Icon: Mail, label: "Cold email coach", prompt: "An agent that critiques and rewrites my cold emails to sound human." },
  { Icon: Brain, label: "Interview prep", prompt: "An agent that drills me on system design interview questions." },
];

const TYPE_SPEED = 35; // ms per char
const ERASE_SPEED = 20;
const HOLD_DURATION = 1800; // ms to hold before erasing

export function PromptDock() {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [hasInteracted, setHasInteracted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ghost typewriter — only when user hasn't typed yet
  const [ghost, setGhost] = useState("");
  useEffect(() => {
    if (hasInteracted) return;

    let cancelled = false;
    let exampleIdx = 0;

    async function loop() {
      while (!cancelled) {
        const target = EXAMPLES[exampleIdx].prompt;
        // Type
        for (let i = 1; i <= target.length; i++) {
          if (cancelled || hasInteracted) return;
          setGhost(target.slice(0, i));
          await sleep(TYPE_SPEED);
        }
        // Hold
        await sleep(HOLD_DURATION);
        if (cancelled || hasInteracted) return;
        // Erase
        for (let i = target.length; i >= 0; i--) {
          if (cancelled || hasInteracted) return;
          setGhost(target.slice(0, i));
          await sleep(ERASE_SPEED);
        }
        exampleIdx = (exampleIdx + 1) % EXAMPLES.length;
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, [hasInteracted]);

  function submit() {
    const text = value.trim();
    if (!text || pending) return;
    const fd = new FormData();
    fd.set("description", text);
    startTransition(() => createAgent(fd));
  }

  function applyExample(prompt: string) {
    setValue(prompt);
    setHasInteracted(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  const showGhost = !hasInteracted && !value;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="glow-hover relative rounded-[2rem] border border-white/20 bg-card/30 p-2 shadow-[0_30px_120px_-30px_rgba(167,139,255,0.5)] backdrop-blur-2xl">
        <div className="relative">
          {/* Ghost text behind the textarea */}
          {showGhost ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 px-6 py-6 text-lg leading-relaxed text-muted-foreground/50"
            >
              {ghost}
              <span className="inline-block h-5 w-[2px] translate-y-1 animate-pulse bg-muted-foreground/50" />
            </div>
          ) : null}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (!hasInteracted) setHasInteracted(true);
            }}
            onFocus={() => setHasInteracted(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder=""
            required
            minLength={5}
            className="relative min-h-40 resize-none rounded-3xl border-0 bg-transparent p-6 text-lg leading-relaxed shadow-none focus-visible:ring-0"
            disabled={pending}
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
          <div className="text-xs text-muted-foreground">
            <kbd className="rounded border border-white/15 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">
              ⌘
            </kbd>
            <span className="mx-1">+</span>
            <kbd className="rounded border border-white/15 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
            <span className="ml-2">to build</span>
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || !value.trim()}
            className="group h-12 rounded-full bg-white px-7 text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.02] disabled:scale-100"
          >
            {pending ? "Building…" : "Build agent"}
            {!pending ? (
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            ) : null}
          </Button>
        </div>
      </div>

      {/* Example chips: fill the textarea, don't submit */}
      <div className="mt-8">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Or start from an example
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {EXAMPLES.map(({ Icon, label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => applyExample(prompt)}
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm transition hover:border-white/30 hover:bg-white/[0.08] hover:scale-105"
            >
              <Icon className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
