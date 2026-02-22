import type { AnthropicUsage } from "../types.ts";
import {
  findAnthropicModel,
  resolveAnthropicModelName,
} from "../models/anthropic.ts";
import type { AnthropicPricing } from "../models/types.ts";

const TIERED_PRICING_THRESHOLD_TOKENS = 200_000;

function selectInputBaseRate(
  pricing: AnthropicPricing,
  inputTokens: number,
): number {
  if (pricing.tiered && inputTokens > TIERED_PRICING_THRESHOLD_TOKENS) {
    return pricing.inputBaseOver200k;
  }
  return pricing.inputBase;
}

function selectOutputRate(
  pricing: AnthropicPricing,
  inputTokens: number,
): number {
  if (pricing.tiered && inputTokens > TIERED_PRICING_THRESHOLD_TOKENS) {
    return pricing.outputOver200k;
  }
  return pricing.output;
}

function selectCacheWriteRate(
  pricing: AnthropicPricing,
  inputTokens: number,
): number {
  if (pricing.tiered && inputTokens > TIERED_PRICING_THRESHOLD_TOKENS) {
    return pricing.cacheWriteOver200k;
  }
  return pricing.cacheWrite;
}

function selectCacheReadRate(
  pricing: AnthropicPricing,
  inputTokens: number,
): number {
  if (pricing.tiered && inputTokens > TIERED_PRICING_THRESHOLD_TOKENS) {
    return pricing.cacheReadOver200k;
  }
  return pricing.cacheRead;
}

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

    const cacheReadRate = selectCacheReadRate(pricing, usage.input_tokens);
    const cacheWriteRate = selectCacheWriteRate(pricing, usage.input_tokens);

    cost += cacheHitsInMillions * cacheReadRate;
    cost += cacheWritesInMillions * cacheWriteRate;
  }

  const inputBaseRate = selectInputBaseRate(pricing, usage.input_tokens);
  cost += baseInputTokensInMillions * inputBaseRate;

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

  const outputRate = selectOutputRate(pricing, usage.input_tokens);
  return outputTokensInMillions * outputRate;
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
