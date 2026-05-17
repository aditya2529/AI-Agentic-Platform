import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, buildMessages, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { BuildChat } from "./BuildChat";
import { AgentSpecBar } from "./AgentSpecBar";

const TOOL_LABELS: Record<AgentSpec["tools"][number], string> = {
  http_fetch: "HTTP Fetch",
  web_search: "Web Search",
  calculator: "Calculator",
};

export default async function AgentBuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, session.user.id)))
    .limit(1);

  if (!agent) notFound();

  const messages = await db
    .select({
      id: buildMessages.id,
      role: buildMessages.role,
      content: buildMessages.content,
    })
    .from(buildMessages)
    .where(eq(buildMessages.agentId, id))
    .orderBy(asc(buildMessages.createdAt));

  const spec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;
  const toolBadges = spec.tools.map((t) => ({ key: t, label: TOOL_LABELS[t] }));

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg -z-10" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between border-b border-white/10 bg-background/60 px-8 py-4 backdrop-blur-2xl">
        <div className="flex items-center gap-5">
          <Link
            href="/agents"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{agent.name}</h1>
        </div>
        {spec.summary ? (
          <Link
            href={`/agents/${agent.id}/run`}
            className="group inline-flex h-11 items-center rounded-full bg-white px-6 text-base font-semibold text-black transition hover:bg-white/90 hover:scale-[1.03]"
          >
            ▶ Test agent
            <span className="ml-2 inline-block transition group-hover:translate-x-1">→</span>
          </Link>
        ) : (
          <button
            disabled
            title="Describe your agent first"
            className="inline-flex h-11 cursor-not-allowed items-center rounded-full border border-white/10 px-6 text-base font-medium text-muted-foreground/60"
          >
            ▶ Test agent
          </button>
        )}
      </div>

      {/* Live spec bar — sticks just below the header, always above the chat */}
      <AgentSpecBar summary={spec.summary} tools={toolBadges} systemPrompt={spec.systemPrompt} />

      {/* Chat */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <BuildChat agentId={agent.id} initialMessages={messages} />
      </div>
    </div>
  );
}
