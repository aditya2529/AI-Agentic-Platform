import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, buildMessages, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { BuildView } from "./BuildView";

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

  return (
    <BuildView
      agentId={agent.id}
      initialName={agent.name}
      initialSpec={spec}
      initialMessages={messages}
    />
  );
}
