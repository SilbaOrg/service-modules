import { countTokensOpenAI } from "./openai-token-counter.ts";

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

export type TokenCountItem = {
  id: string;
  text: string;
};

export type TokenCountResult = {
  id: string;
  tokens: number;
};

export function countTokensAnthropicBatch(
  items: Array<TokenCountItem>
): Array<TokenCountResult> {
  return items.map((item) => ({
    id: item.id,
    tokens: countTokensAnthropic(item.text),
  }));
}
