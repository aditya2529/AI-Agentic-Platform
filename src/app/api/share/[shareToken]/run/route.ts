import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
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
    .min(1)
    .max(50),
});

// Public endpoint — no auth. Access is gated by the unguessable shareToken
// and the agent must have isPublic=true.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.shareToken, shareToken), eq(agents.isPublic, true)))
    .limit(1);
  if (!agent) return new NextResponse("Not found", { status: 404 });

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return new NextResponse("Invalid request", { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new NextResponse("GROQ_API_KEY is not configured on the server.", { status: 500 });
  }

  const spec: AgentSpec = (agent.spec ?? EMPTY_SPEC) as AgentSpec;
  const model = createGroq({ apiKey })("llama-3.3-70b-versatile");

  const result = streamText({
    model,
    system: spec.systemPrompt,
    messages: parsed.messages,
  });

  return result.toTextStreamResponse();
}
