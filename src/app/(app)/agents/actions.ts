"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, buildMessages, type AgentGraph } from "@/db/schema";
import { refineAgentSpec } from "@/lib/builder-ai";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const nameSchema = z.string().min(1).max(80);
const descriptionSchema = z.string().min(5).max(2000);

function nameFromDescription(desc: string): string {
  const cleaned = desc.trim().replace(/\s+/g, " ");
  const firstSentence = cleaned.split(/[.!?\n]/)[0];
  return firstSentence.slice(0, 60) || "Untitled agent";
}

export async function createAgent(formData: FormData) {
  const userId = await requireUserId();
  const description = descriptionSchema.parse(
    String(formData.get("description") ?? "").trim(),
  );
  const name = nameFromDescription(description);

  const [row] = await db
    .insert(agents)
    .values({ userId, name, description })
    .returning({ id: agents.id });

  // Kick off the first round of the build chat so the agent already has a
  // real spec when the user lands on the build page.
  await db.insert(buildMessages).values({
    agentId: row.id,
    role: "user",
    content: description,
  });

  try {
    const { updatedSpec, assistantReply } = await refineAgentSpec({
      currentSpec: { systemPrompt: "You are a helpful assistant.", tools: [], summary: "" },
      history: [],
      userMessage: description,
    });
    await db.insert(buildMessages).values({
      agentId: row.id,
      role: "assistant",
      content: assistantReply,
    });
    await db
      .update(agents)
      .set({ spec: updatedSpec, updatedAt: new Date() })
      .where(eq(agents.id, row.id));
  } catch (err) {
    await db.insert(buildMessages).values({
      agentId: row.id,
      role: "assistant",
      content: `I couldn't reach the AI designer just now: ${
        err instanceof Error ? err.message : String(err)
      }. Tell me what your agent should do and I'll try again.`,
    });
  }

  revalidatePath("/agents");
  redirect(`/agents/${row.id}/build`);
}

export async function renameAgent(id: string, name: string) {
  const userId = await requireUserId();
  const parsed = nameSchema.parse(name);
  await db
    .update(agents)
    .set({ name: parsed, updatedAt: new Date() })
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
}

export async function deleteAgent(id: string) {
  const userId = await requireUserId();
  await db.delete(agents).where(and(eq(agents.id, id), eq(agents.userId, userId)));
  revalidatePath("/agents");
}

const graphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["llm", "tool", "input", "output"]),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.string(), z.unknown()),
    }),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().nullable().optional(),
      targetHandle: z.string().nullable().optional(),
    }),
  ),
});

export async function saveAgentGraph(id: string, graph: AgentGraph) {
  const userId = await requireUserId();
  const parsed = graphSchema.parse(graph) as AgentGraph;
  await db
    .update(agents)
    .set({ graph: parsed, updatedAt: new Date() })
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
}
