import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agents, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { PublicRunChat } from "./PublicRunChat";

export const metadata = {
  robots: { index: false, follow: false },
};

const TOOL_LABELS: Record<AgentSpec["tools"][number], string> = {
  http_fetch: "HTTP Fetch",
  web_search: "Web Search",
  calculator: "Calculator",
};

export default async function PublicAgentChatPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      spec: agents.spec,
      isPublic: agents.isPublic,
    })
    .from(agents)
    .where(and(eq(agents.shareToken, shareToken), eq(agents.isPublic, true)))
    .limit(1);

  if (!agent) notFound();

  const spec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 grid-bg -z-10" />

      <div className="relative flex items-center justify-between gap-4 border-b border-white/10 bg-background/60 px-6 py-4 backdrop-blur-2xl sm:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-gradient">Agentic</span>
          </span>
          <div className="h-5 w-px shrink-0 bg-white/10" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {agent.name}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{spec.summary}</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {spec.tools.map((t) => (
            <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {TOOL_LABELS[t]}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <PublicRunChat shareToken={shareToken} agentName={agent.name} />
      </div>
    </div>
  );
}
