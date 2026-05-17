import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { agents, buildMessages, EMPTY_SPEC, type AgentSpec } from "@/db/schema";
import { streamRefineAgentSpec, type RefineResponse } from "@/lib/builder-ai";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
});

// Streams partial RefineResponse objects to the client as JSON lines.
// Each line is `{"type":"partial","value":{...}}` or `{"type":"final","value":{...}}`
// or `{"type":"error","message":"..."}`. The client reads, parses, and updates
// the spec bar + assistant bubble in real time.
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

  const { message } = bodySchema.parse(await req.json());
  const trimmed = message.trim();
  if (!trimmed) return new NextResponse("Empty message", { status: 400 });

  // Persist user message immediately so it survives a dropped stream.
  await db.insert(buildMessages).values({ agentId: id, role: "user", content: trimmed });

  const history = await db
    .select({ role: buildMessages.role, content: buildMessages.content })
    .from(buildMessages)
    .where(eq(buildMessages.agentId, id))
    .orderBy(asc(buildMessages.createdAt));
  const priorHistory = history.slice(0, -1);

  let result: ReturnType<typeof streamRefineAgentSpec>;
  try {
    result = streamRefineAgentSpec({
      currentSpec: (agent.spec ?? EMPTY_SPEC) as AgentSpec,
      history: priorHistory,
      userMessage: trimmed,
    });
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Failed to start stream",
      { status: 500 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        for await (const partial of result.partialObjectStream) {
          send({ type: "partial", value: partial });
        }

        const final = (await result.object) as RefineResponse;
        send({ type: "final", value: final });

        // Persist final result. We do this after the stream finishes so the
        // client perceives the full delta. If the persist fails the user still
        // saw the spec — the next refine will retry from the prior persisted
        // spec, which is acceptable for the MVP.
        await db.insert(buildMessages).values({
          agentId: id,
          role: "assistant",
          content: final.assistantReply,
        });
        await db
          .update(agents)
          .set({
            name: final.name,
            spec: final.updatedSpec,
            updatedAt: new Date(),
          })
          .where(eq(agents.id, id));
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Stream failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson",
      "cache-control": "no-store",
    },
  });
}
