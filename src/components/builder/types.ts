import type { Provider } from "@/lib/providers";
import type { BuiltInToolName } from "@/runtime/tools/registry";

export type LlmNodeData = {
  provider: Provider;
  model: string;
  systemPrompt: string;
};

export type ToolNodeData = {
  toolName: BuiltInToolName;
};

export type InputNodeData = {
  label: string;
};

export type OutputNodeData = {
  label: string;
};

export type NodeKind = "llm" | "tool" | "input" | "output";

export type NodeDataByKind = {
  llm: LlmNodeData;
  tool: ToolNodeData;
  input: InputNodeData;
  output: OutputNodeData;
};
