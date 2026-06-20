import type { CostDetails, DeepSeekUsage } from "../types.ts";
import { findDeepSeekModel } from "../models/deepseek.ts";

function calculateDeepSeekCost(
  model: string,
  usage: DeepSeekUsage,
): CostDetails {
  if (!model) {
    throw new Error("Model is required for cost calculation");
  }
  if (!usage) {
    throw new Error("Usage data is required for cost calculation");
  }
  if (typeof usage.prompt_tokens !== "number" || usage.prompt_tokens < 0) {
    throw new Error(`Invalid prompt_tokens: ${usage.prompt_tokens}`);
  }
  if (
    typeof usage.completion_tokens !== "number" || usage.completion_tokens < 0
  ) {
    throw new Error(`Invalid completion_tokens: ${usage.completion_tokens}`);
  }

  const modelEntry = findDeepSeekModel(model);
  const { pricing } = modelEntry;

  const cacheHitTokens = usage.cache_hit_tokens ?? 0;
  if (cacheHitTokens < 0 || cacheHitTokens > usage.prompt_tokens) {
    throw new Error(
      `Invalid cache_hit_tokens: ${cacheHitTokens} (prompt_tokens: ${usage.prompt_tokens})`,
    );
  }

  const cacheMissTokens = usage.prompt_tokens - cacheHitTokens;

  const cacheHitTokensInMillions = cacheHitTokens / 1_000_000;
  const cacheMissTokensInMillions = cacheMissTokens / 1_000_000;
  const completionTokensInMillions = usage.completion_tokens / 1_000_000;

  const inputCost = cacheHitTokensInMillions * pricing.inputCacheHit +
    cacheMissTokensInMillions * pricing.inputCacheMiss;
  const outputCost = completionTokensInMillions * pricing.output;
  const totalCost = inputCost + outputCost;

  const result = {
    input: Math.round(inputCost * 1000000) / 1000000,
    output: Math.round(outputCost * 1000000) / 1000000,
    total: Math.round(totalCost * 1000000) / 1000000,
  };

  if (
    typeof result.input !== "number" || isNaN(result.input) || result.input < 0
  ) {
    throw new Error(`Invalid calculated input cost: ${result.input}`);
  }
  if (
    typeof result.output !== "number" || isNaN(result.output) ||
    result.output < 0
  ) {
    throw new Error(`Invalid calculated output cost: ${result.output}`);
  }
  if (
    typeof result.total !== "number" || isNaN(result.total) || result.total < 0
  ) {
    throw new Error(`Invalid calculated total cost: ${result.total}`);
  }

  return result;
}

export { calculateDeepSeekCost };
