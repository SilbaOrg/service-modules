import type { CostDetails, GoogleUsage } from "../types.ts";
import { findGoogleModel } from "../models/google.ts";

function calculateGoogleCost(model: string, usage: GoogleUsage): CostDetails {
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

  const modelEntry = findGoogleModel(model);
  const { pricing } = modelEntry;

  const inputTokensInMillions = usage.prompt_tokens / 1_000_000;
  const outputTokensInMillions = usage.completion_tokens / 1_000_000;
  const cachedTokensInMillions = (usage.cached_tokens ?? 0) / 1_000_000;

  let inputCost = 0;
  let outputCost = 0;

  if (usage.batch_mode && pricing.batchInput !== undefined) {
    inputCost = inputTokensInMillions * pricing.batchInput;
  } else if (cachedTokensInMillions > 0) {
    const nonCachedTokensInMillions =
      inputTokensInMillions - cachedTokensInMillions;
    inputCost = nonCachedTokensInMillions * pricing.input +
      cachedTokensInMillions * pricing.cacheRead;
  } else {
    inputCost = inputTokensInMillions * pricing.input;
  }

  if (usage.batch_mode && pricing.batchOutput !== undefined) {
    outputCost = outputTokensInMillions * pricing.batchOutput;
  } else {
    outputCost = outputTokensInMillions * pricing.output;
  }

  const totalCost = inputCost + outputCost;

  const result = {
    input: Math.round(inputCost * 1000000) / 1000000,
    output: Math.round(outputCost * 1000000) / 1000000,
    total: Math.round(totalCost * 1000000) / 1000000,
  };

  if (typeof result.input !== "number" || isNaN(result.input) || result.input < 0) {
    throw new Error(`Invalid calculated input cost: ${result.input}`);
  }
  if (typeof result.output !== "number" || isNaN(result.output) || result.output < 0) {
    throw new Error(`Invalid calculated output cost: ${result.output}`);
  }
  if (typeof result.total !== "number" || isNaN(result.total) || result.total < 0) {
    throw new Error(`Invalid calculated total cost: ${result.total}`);
  }

  return result;
}

export { calculateGoogleCost };
