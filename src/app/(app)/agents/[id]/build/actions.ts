"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, buildMessages, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { refineAgentSpec } from "@/lib/builder-ai";

const messageSchema = z.string().min(1).max(2000);

export async function sendBuildMessage(agentId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = messageSchema.parse(content.trim());

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.userId, session.user.id)))
    .limit(1);

  if (!agent) throw new Error("Agent not found");

  await db.insert(buildMessages).values({ agentId, role: "user", content: trimmed });

  const history = await db
    .select({ role: buildMessages.role, content: buildMessages.content })
    .from(buildMessages)
    .where(eq(buildMessages.agentId, agentId))
    .orderBy(asc(buildMessages.createdAt));

  const priorHistory = history.slice(0, -1);

  const { updatedSpec, name, assistantReply } = await refineAgentSpec({
    currentSpec: (agent.spec ?? EMPTY_SPEC) as AgentSpec,
    history: priorHistory,
    userMessage: trimmed,
  });

  await db.insert(buildMessages).values({
    agentId,
    role: "assistant",
    content: assistantReply,
  });

  await db
    .update(agents)
    .set({ name, spec: updatedSpec, updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  revalidatePath(`/agents/${agentId}/build`);
}
