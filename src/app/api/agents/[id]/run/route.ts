import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, EMPTY_SPEC, type AgentSpec } from "@/db/schema";

export const runtime = "nodejs";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, session.user.id)))
    .limit(1);

  if (!agent) return new NextResponse("Not found", { status: 404 });

  const json = await req.json();
  const { messages } = bodySchema.parse(json);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new NextResponse("GROQ_API_KEY is not configured on the server.", { status: 500 });
  }

  const spec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;
  const model = createGroq({ apiKey })("llama-3.3-70b-versatile");

  const result = streamText({
    model,
    system: spec.systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
