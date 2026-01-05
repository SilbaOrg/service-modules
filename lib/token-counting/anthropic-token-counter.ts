import { countTokensOpenAI, countTokensOpenAIBatch } from "./openai-token-counter.ts";
import type { TokenCountItem, TokenCountResult } from "./openai-token-counter.ts";

const OPENAI_TO_ANTHROPIC_MULTIPLIER = 1.25;

export function countTokensAnthropic(text: string): number {
  if (typeof text !== "string") {
    throw new Error(`countTokensAnthropic expects a string, got ${typeof text}`);
  }

  if (text.length === 0) {
    return 0;
  }

  const openaiTokens = countTokensOpenAI(text);
  return Math.ceil(openaiTokens * OPENAI_TO_ANTHROPIC_MULTIPLIER);
}

export type { TokenCountItem, TokenCountResult };

export function countTokensAnthropicBatch(
  items: Array<TokenCountItem>
): Array<TokenCountResult> {
  return items.map((item) => ({
    id: item.id,
    tokens: countTokensAnthropic(item.text),
  }));
}

export async function countTokensAnthropicBatchAsync(
  items: Array<TokenCountItem>
): Promise<Array<TokenCountResult>> {
  const openaiResults = await countTokensOpenAIBatch(items);
  return openaiResults.map((result) => ({
    id: result.id,
    tokens: Math.ceil(result.tokens * OPENAI_TO_ANTHROPIC_MULTIPLIER),
  }));
}
