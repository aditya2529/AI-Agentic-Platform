import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAgent, deleteAgent } from "./actions";

const EXAMPLES = [
  { emoji: "✍️", label: "LinkedIn post writer", prompt: "An agent that writes catchy LinkedIn posts from a topic I give it." },
  { emoji: "💡", label: "Side-hustle ideas", prompt: "An agent that brainstorms side-hustle business ideas tailored to my skills." },
  { emoji: "📚", label: "Math tutor", prompt: "A math tutor that walks me through problems step by step." },
  { emoji: "🔗", label: "URL summarizer", prompt: "A bot that summarizes any URL I send it in 3 bullet points." },
  { emoji: "🎯", label: "Cold email coach", prompt: "An agent that critiques and rewrites my cold emails to sound human." },
  { emoji: "🧠", label: "Interview prep", prompt: "An agent that drills me on system design interview questions." },
];

export default async function AgentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, session.user.id))
    .orderBy(desc(agents.updatedAt));

  return (
    <main className="relative h-full overflow-y-auto">
      <div className="aurora" />
      <div className="aurora-extra" />
      <div className="absolute inset-0 grid-bg -z-10" />

      <div className="relative mx-auto max-w-6xl px-6 pb-32 pt-20 sm:pt-28">
        {/* Hero */}
        <div className="fade-up text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            Live · Powered by Groq
          </div>

          <h1 className="mt-8 text-[clamp(3rem,9vw,8.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
            <span className="block">Build an</span>
            <span className="block text-gradient">AI agent.</span>
            <span className="block text-muted-foreground/80">In one sentence.</span>
          </h1>

          <p className="mx-auto mt-10 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Describe what your agent should do. We build it instantly.
            <br />
            No code. No setup. Just words.
          </p>
        </div>

        {/* Prompt dock */}
        <form
          action={createAgent}
          className="fade-up mx-auto mt-16 max-w-3xl"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="glow-hover relative rounded-[2rem] border border-white/20 bg-card/30 p-2 shadow-[0_30px_120px_-30px_rgba(167,139,255,0.5)] backdrop-blur-2xl">
            <Textarea
              name="description"
              placeholder={`Describe your agent…\n\ne.g. "An agent that writes catchy LinkedIn posts from a topic I give it."`}
              required
              minLength={5}
              className="min-h-40 resize-none rounded-3xl border-0 bg-transparent p-6 text-lg leading-relaxed shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="rounded border border-white/15 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">
                  llama-3.3-70b
                </kbd>
                <span>Free, instant</span>
              </div>
              <Button
                type="submit"
                className="group h-12 rounded-full bg-white px-7 text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.02]"
              >
                Build agent
                <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Examples carousel */}
        <div className="fade-up mt-12" style={{ animationDelay: "0.3s" }}>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Or start from an example
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {EXAMPLES.map((ex) => (
              <form key={ex.label} action={createAgent}>
                <input type="hidden" name="description" value={ex.prompt} />
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm transition hover:border-white/30 hover:bg-white/[0.08] hover:scale-105"
                >
                  <span className="text-base">{ex.emoji}</span>
                  <span className="font-medium">{ex.label}</span>
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* Existing agents */}
        {rows.length > 0 ? (
          <div className="mt-32">
            <div className="mb-10 flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Library
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">Your agents</h2>
              </div>
              <span className="text-sm text-muted-foreground">{rows.length} agent{rows.length === 1 ? "" : "s"}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((agent, i) => (
                <div
                  key={agent.id}
                  className="group fade-up glow-hover relative overflow-hidden rounded-3xl border border-white/10 bg-card/30 p-6 backdrop-blur-xl transition hover:bg-card/60"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <Link href={`/agents/${agent.id}/build`} className="block">
                    <h3 className="text-lg font-semibold tracking-tight">{agent.name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {agent.spec.summary || "Tap to keep building."}
                    </p>
                  </Link>

                  <div className="mt-6 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/agents/${agent.id}/build`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/agents/${agent.id}/run`}
                        className="inline-flex h-7 items-center rounded-full bg-white px-3 text-xs font-semibold text-black transition hover:bg-white/90"
                      >
                        Run →
                      </Link>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAgent(agent.id);
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
