import { z } from "zod";
import { tool, type Tool } from "ai";

// Built-in tools. `execute` bodies land in Step 9 — for now they throw so the
// palette/builder can already reference real metadata.

export const builtInToolDefs = {
  http_fetch: {
    label: "HTTP Fetch",
    description: "Perform an HTTP GET/POST and return the response body as text.",
    tool: tool({
      description: "Fetch a URL and return the response body (truncated to 8 KB).",
      inputSchema: z.object({
        url: z.string().url(),
        method: z.enum(["GET", "POST"]).default("GET"),
        body: z.string().optional(),
      }),
      execute: async (): Promise<string> => {
        throw new Error("http_fetch.execute not implemented yet");
      },
    }),
  },
  web_search: {
    label: "Web Search",
    description: "Search the web for current information. Returns the top results.",
    tool: tool({
      description: "Search the web and return the top results as a list.",
      inputSchema: z.object({
        query: z.string().min(1),
      }),
      execute: async (): Promise<string> => {
        throw new Error("web_search.execute not implemented yet");
      },
    }),
  },
  calculator: {
    label: "Calculator",
    description: "Evaluate a simple arithmetic expression like '2 * (3 + 4)'.",
    tool: tool({
      description: "Evaluate a basic arithmetic expression. Numbers and + - * / ( ) only.",
      inputSchema: z.object({
        expression: z.string().min(1),
      }),
      execute: async (): Promise<string> => {
        throw new Error("calculator.execute not implemented yet");
      },
    }),
  },
} as const satisfies Record<string, { label: string; description: string; tool: Tool }>;

export type BuiltInToolName = keyof typeof builtInToolDefs;
export const BUILT_IN_TOOL_NAMES = Object.keys(builtInToolDefs) as BuiltInToolName[];

export function isBuiltInTool(name: string): name is BuiltInToolName {
  return name in builtInToolDefs;
}
