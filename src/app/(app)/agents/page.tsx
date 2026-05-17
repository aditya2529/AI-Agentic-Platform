import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { MoreHorizontal } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAgent } from "./actions";
import { PromptDock } from "./PromptDock";

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

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16">
        {/* Hero — single line, returning users see library above fold */}
        <div className="fade-up text-center">
          <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
            Build an AI agent <span className="text-gradient">in one sentence</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Describe what your agent should do. We build it instantly. No code.
          </p>
        </div>

        {/* Prompt dock with ghost typewriter */}
        <div className="fade-up mt-10" style={{ animationDelay: "0.15s" }}>
          <PromptDock />
        </div>

        {/* Library */}
        <div className="mt-20">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Your library</h2>
            <span className="text-sm text-muted-foreground">
              {rows.length} agent{rows.length === 1 ? "" : "s"}
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-card/20 p-10 text-center">
              <p className="text-base text-muted-foreground">
                You haven&apos;t built one yet — try an example above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((agent, i) => (
                <div
                  key={agent.id}
                  className="group fade-up glow-hover relative overflow-hidden rounded-3xl border border-white/10 bg-card/30 p-6 backdrop-blur-xl transition hover:bg-card/60"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <Link href={`/agents/${agent.id}/build`} className="block">
                    <h3 className="text-lg font-semibold tracking-tight">{agent.name}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {agent.spec.summary || "Keep building."}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[popup-open]:opacity-100"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <form
                          action={async () => {
                            "use server";
                            await deleteAgent(agent.id);
                          }}
                        >
                          <DropdownMenuItem variant="destructive" closeOnClick={true}>
                            <button type="submit" className="w-full text-left">
                              Delete agent
                            </button>
                          </DropdownMenuItem>
                        </form>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
