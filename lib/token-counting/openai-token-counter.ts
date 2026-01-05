import { encoding_for_model } from "tiktoken";

let cachedEncoder: ReturnType<typeof encoding_for_model> | null = null;

function getEncoder(): ReturnType<typeof encoding_for_model> {
  if (!cachedEncoder) {
    cachedEncoder = encoding_for_model("gpt-5-mini");
  }
  return cachedEncoder;
}

export function countTokensOpenAI(text: string): number {
  if (typeof text !== "string") {
    throw new Error(`countTokensOpenAI expects a string, got ${typeof text}`);
  }

  if (text.length === 0) {
    return 0;
  }

  const encoder = getEncoder();
  const tokens = encoder.encode(text);
  return tokens.length;
}

export type TokenCountItem = {
  id: string;
  text: string;
};

export type TokenCountResult = {
  id: string;
  tokens: number;
};

const BATCH_SIZE = 20;

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function countTokensOpenAIBatch(
  items: Array<TokenCountItem>
): Promise<Array<TokenCountResult>> {
  const results: Array<TokenCountResult> = [];
  const encoder = getEncoder();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const tokens = item.text.length === 0 ? 0 : encoder.encode(item.text).length;
    results.push({ id: item.id, tokens });

    if ((i + 1) % BATCH_SIZE === 0 && i < items.length - 1) {
      await yieldToEventLoop();
    }
  }

  return results;
}
