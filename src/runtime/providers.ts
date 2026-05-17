import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider-v2";
import type { LanguageModel } from "ai";
import type { Provider } from "@/lib/providers";

// Single place that knows how to turn (provider, model, apiKey) into a
// Vercel AI SDK LanguageModel. Used by the executor (Step 8+).
export function getModel(provider: Provider, modelId: string, apiKey: string | null): LanguageModel {
  switch (provider) {
    case "anthropic":
      if (!apiKey) throw new Error("Anthropic API key missing");
      return createAnthropic({ apiKey })(modelId);
    case "openai":
      if (!apiKey) throw new Error("OpenAI API key missing");
      return createOpenAI({ apiKey })(modelId);
    case "google":
      if (!apiKey) throw new Error("Google API key missing");
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "ollama":
      return createOllama({ baseURL: process.env.OLLAMA_BASE_URL })(modelId);
  }
}
