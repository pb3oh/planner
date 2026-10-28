export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CompleteOptions = {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
};

export type LLMProviderId = "mock" | "anthropic";

export interface LLMProvider {
  readonly id: LLMProviderId;
  complete(options: CompleteOptions): Promise<string>;
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.search(/[{[]/);
  if (start === -1) throw new Error("No JSON object in model output");
  return JSON.parse(raw.slice(start));
}

export function taskTag(kind: string): string {
  return `[task:${kind}]`;
}

export function parseTaskKind(system?: string): string | null {
  const match = system?.match(/\[task:([a-z0-9_-]+)\]/i);
  return match?.[1] ?? null;
}
