import { anthropicProvider } from "@/lib/llm/anthropic";
import { mockProvider } from "@/lib/llm/mock";
import type { LLMProvider, LLMProviderId } from "@/lib/llm/types";

export type { ChatMessage, CompleteOptions, LLMProvider, LLMProviderId } from "@/lib/llm/types";
export { extractJson, taskTag } from "@/lib/llm/types";

export function getProvider(): LLMProvider {
  const id = (process.env.LLM_PROVIDER ?? "mock").toLowerCase() as LLMProviderId;
  if (id === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing; falling back to mock");
      return mockProvider;
    }
    return anthropicProvider;
  }
  return mockProvider;
}

export async function complete(
  options: Parameters<LLMProvider["complete"]>[0]
): Promise<string> {
  return getProvider().complete(options);
}
