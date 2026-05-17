import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { RunChat } from "./RunChat";

const TOOL_LABELS: Record<AgentSpec["tools"][number], string> = {
  http_fetch: "HTTP Fetch",
  web_search: "Web Search",
  calculator: "Calculator",
};

export default async function AgentRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, session.user.id)))
    .limit(1);

  if (!agent) notFound();
  const spec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg -z-10" />

      <div className="relative flex items-center justify-between border-b border-white/10 bg-background/60 px-8 py-4 backdrop-blur-2xl">
        <div className="flex items-center gap-5">
          <Link
            href="/agents"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{agent.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{spec.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {spec.tools.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {TOOL_LABELS[t]}
            </Badge>
          ))}
          <Link
            href={`/agents/${agent.id}/build`}
            className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-muted-foreground transition hover:border-white/30 hover:text-foreground"
          >
            Edit
          </Link>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <RunChat agentId={agent.id} />
      </div>
    </div>
  );
}
