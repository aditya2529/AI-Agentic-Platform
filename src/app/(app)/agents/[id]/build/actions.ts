"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, EMPTY_SPEC, type AgentSpec } from "@/db/schema";

const promptSchema = z.string().min(10).max(8000);

export async function updateSystemPrompt(agentId: string, systemPrompt: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmed = promptSchema.parse(systemPrompt.trim());

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.userId, session.user.id)))
    .limit(1);
  if (!agent) throw new Error("Agent not found");

  const currentSpec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;
  const nextSpec: AgentSpec = { ...currentSpec, systemPrompt: trimmed };

  await db
    .update(agents)
    .set({ spec: nextSpec, updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  revalidatePath(`/agents/${agentId}/build`);
  revalidatePath(`/agents/${agentId}/run`);
}
