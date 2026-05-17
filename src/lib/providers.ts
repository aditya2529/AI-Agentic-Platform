// Single source of truth for which LLM providers + models the platform supports.
// Consumed by: the API-keys page, the LLM node in the builder, and the runtime.

export const PROVIDERS = ["anthropic", "openai", "google", "ollama"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  ollama: "Ollama (local)",
};

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  openai: ["gpt-4o", "gpt-4o-mini"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
  ollama: ["llama3.1", "qwen2.5"],
};

export function isProvider(x: unknown): x is Provider {
  return typeof x === "string" && (PROVIDERS as readonly string[]).includes(x);
}
