import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import type { AgentSpec } from "@/db/schema";

// Single platform-owned Groq key powers the "chat-to-build" feature.
// Groq's free tier is generous and reliable — no per-project quota footguns
// like Gemini has.
function getBuilderModel() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set — needed for chat-to-build.");
  }
  // Must support structured outputs on Groq.
  return createGroq({ apiKey })("openai/gpt-oss-120b");
}

const SpecSchema = z.object({
  systemPrompt: z
    .string()
    .min(10)
    .describe("The instructions the agent will follow. Written in second person."),
  tools: z
    .array(z.enum(["http_fetch", "web_search", "calculator"]))
    .describe("Tools the agent should have access to. Pick only what's needed."),
  summary: z
    .string()
    .min(5)
    .describe("A short, friendly one-line description of what this agent does."),
});

const RefineResponseSchema = z.object({
  updatedSpec: SpecSchema,
  assistantReply: z
    .string()
    .min(1)
    .describe("What to say to the user about what just changed in their agent."),
});

const SYSTEM_PROMPT = `You are an "agent designer" that helps a user define an AI agent by chatting.

You will be given:
- the agent's CURRENT spec (system prompt + selected tools + summary)
- the full chat history so far
- the user's newest message

Your job: produce an UPDATED spec that reflects what the user is asking for, and a short reply explaining what you changed.

Rules:
- Only enable tools the agent actually needs. Available tools:
  - http_fetch — fetches a URL
  - web_search — searches the web for current information
  - calculator — evaluates math expressions
- Keep the system prompt focused. Write it as instructions to the agent.
- The summary is one friendly sentence the user will see.
- If the user's message is unclear, make a reasonable guess and explain in your reply.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function refineAgentSpec(args: {
  currentSpec: AgentSpec;
  history: ChatMessage[];
  userMessage: string;
}): Promise<{ updatedSpec: AgentSpec; assistantReply: string }> {
  const model = getBuilderModel();

  const historyText = args.history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const prompt = `CURRENT SPEC:
${JSON.stringify(args.currentSpec, null, 2)}

CHAT HISTORY:
${historyText || "(none yet)"}

USER'S NEW MESSAGE:
${args.userMessage}`;

  const { object } = await generateObject({
    model,
    schema: RefineResponseSchema,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return {
    updatedSpec: object.updatedSpec,
    assistantReply: object.assistantReply,
  };
}
