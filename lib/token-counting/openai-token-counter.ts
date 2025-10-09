/**
 * OpenAI Token Counting Utilities
 * Uses tiktoken for local, synchronous token counting
 */

import { encoding_for_model } from "tiktoken";

/**
 * Count tokens for a given string using OpenAI's tokenization for GPT-5-mini.
 * GPT-5 models use the o200k_base encoding.
 *
 * This is a synchronous, local operation (no API call required).
 *
 * @param text - The text to count tokens for
 * @returns The number of tokens
 * @throws Error if text is not a string or if encoding fails
 */
export function countTokensOpenAI(text: string): number {
  if (typeof text !== "string") {
    throw new Error(`countTokensOpenAI expects a string, got ${typeof text}`);
  }

  if (text.length === 0) {
    return 0;
  }

  const encoder = encoding_for_model("gpt-5-mini");
  const tokens = encoder.encode(text);
  const count = tokens.length;
  encoder.free();

  return count;
}
