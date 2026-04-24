import type { AnthropicUsage } from "../types.ts";
import {
  findAnthropicModel,
  resolveAnthropicModelName,
} from "../models/anthropic.ts";
import type { AnthropicPricing } from "../models/types.ts";

function calculateInputCost(
  pricing: AnthropicPricing,
  usage: AnthropicUsage,
): number {
  const inputTokensInMillions = usage.input_tokens / 1_000_000;

  if (usage.batch_mode) {
    return inputTokensInMillions * pricing.batchInput;
  }

  let cost = 0;
  let baseInputTokensInMillions = inputTokensInMillions;

  if (usage.cache_hits || usage.cache_writes) {
    const cacheHitsInMillions = (usage.cache_hits ?? 0) / 1_000_000;
    const cacheWritesInMillions = (usage.cache_writes ?? 0) / 1_000_000;

    baseInputTokensInMillions = Math.max(
      0,
      inputTokensInMillions - cacheHitsInMillions - cacheWritesInMillions,
    );

    cost += cacheHitsInMillions * pricing.cacheRead;
    cost += cacheWritesInMillions * pricing.cacheWrite5m;
  }

  cost += baseInputTokensInMillions * pricing.inputBase;

  return cost;
}

function calculateOutputCost(
  pricing: AnthropicPricing,
  usage: AnthropicUsage,
): number {
  const outputTokensInMillions = usage.output_tokens / 1_000_000;

  if (usage.batch_mode) {
    return outputTokensInMillions * pricing.batchOutput;
  }

  return outputTokensInMillions * pricing.output;
}

function calculateWebSearchCost(webSearchQueries: number): number {
  return (webSearchQueries / 1000) * 10.0;
}

function calculateAnthropicCost(
  usage: AnthropicUsage,
  modelName: string,
): {
  input: number;
  output: number;
  total: number;
  webSearchQueries: number;
  webSearchQueryCost: number;
} {
  if (typeof usage.input_tokens !== "number") {
    throw new Error("Missing input_tokens in usage data");
  }
  if (typeof usage.output_tokens !== "number") {
    throw new Error("Missing output_tokens in usage data");
  }

  const resolvedName = resolveAnthropicModelName(modelName);
  const modelEntry = findAnthropicModel(resolvedName);
  const { pricing } = modelEntry;

  const input = calculateInputCost(pricing, usage);
  const output = calculateOutputCost(pricing, usage);

  const webSearchQueries = usage.web_search_queries ?? 0;
  const webSearchQueryCost = calculateWebSearchCost(webSearchQueries);

  return {
    input,
    output,
    total: input + output + webSearchQueryCost,
    webSearchQueries,
    webSearchQueryCost,
  };
}

export { calculateAnthropicCost };
export type { AnthropicUsage };
