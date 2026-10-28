import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/constants";
import type { CompleteOptions, LLMProvider } from "@/lib/llm/types";

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  async complete(options: CompleteOptions): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    const client = new Anthropic({ apiKey });
    const system = options.system?.replace(/\[task:[a-z0-9_-]+\]/gi, "").trim();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens ?? 1500,
      system: system || undefined,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
    return response.content.find((b) => b.type === "text")?.text ?? "";
  },
};
