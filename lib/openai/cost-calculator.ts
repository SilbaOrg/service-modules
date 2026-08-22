import type { CostDetails, OpenAIUsage } from "../types.ts";
import { findOpenAIModel, selectOpenAITier } from "../models/openai.ts";

function calculateOpenAICost(model: string, usage: OpenAIUsage): CostDetails {
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

  const modelEntry = findOpenAIModel(model);
  const pricing = selectOpenAITier(modelEntry, usage.prompt_tokens);

  const promptTokensInMillions = usage.prompt_tokens / 1_000_000;
  const completionTokensInMillions = usage.completion_tokens / 1_000_000;
  const cachedTokensInMillions = (usage.cached_tokens ?? 0) / 1_000_000;

  let inputCost = 0;

  if (cachedTokensInMillions > 0) {
    const nonCachedTokensInMillions = promptTokensInMillions -
      cachedTokensInMillions;
    inputCost = nonCachedTokensInMillions * pricing.input +
      cachedTokensInMillions * pricing.cached;
  } else {
    inputCost = promptTokensInMillions * pricing.input;
  }

  const outputCost = completionTokensInMillions * pricing.output;

  let webSearchTokenCost = 0;
  if (usage.web_search_tokens) {
    const webSearchTokensInMillions = usage.web_search_tokens / 1_000_000;
    webSearchTokenCost = webSearchTokensInMillions * pricing.input;
  }

  // $10 per 1,000 calls on reasoning models, which every model in the registry
  // is. Non-reasoning models bill $25 per 1,000 but do not charge for the
  // search-result tokens; none are registered here.
  // Source: developers.openai.com/api/docs/pricing, read 2026-08-22.
  let webSearchQueryCost = 0;
  if (usage.web_search_queries) {
    webSearchQueryCost = (usage.web_search_queries / 1000) * 10.0;
  }

  const totalCost = inputCost + outputCost + webSearchTokenCost +
    webSearchQueryCost;

  const result = {
    input: Math.round((inputCost + webSearchTokenCost) * 1000000) / 1000000,
    output: Math.round(outputCost * 1000000) / 1000000,
    total: Math.round(totalCost * 1000000) / 1000000,
    webSearchQueries: usage.web_search_queries ?? 0,
    webSearchQueryCost: Math.round(webSearchQueryCost * 1000000) / 1000000,
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

export { calculateOpenAICost };
