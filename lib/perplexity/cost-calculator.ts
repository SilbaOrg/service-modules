// Perplexity Cost Calculator
// Calculates the estimated cost in USD for a Perplexity API call
// based on the model, usage, and options, using the official price matrix.

import type { CostDetails, PerplexityUsage } from "../types.ts";

enum PerplexityModel {
  SONAR = "sonar",
  SONAR_PRO = "sonar-pro",
  SONAR_REASONING = "sonar-reasoning",
  SONAR_REASONING_PRO = "sonar-reasoning-pro",
  SONAR_DEEP_RESEARCH = "sonar-deep-research",
}

// Pricing matrix, based on May 2025 Perplexity docs
const PRICING = {
  sonar: {
    input: { low: 0.001, medium: 0.001, high: 0.001 }, // $ per 1k tokens
    output: { low: 0.001, medium: 0.001, high: 0.001 },
    perRequest: { low: 0.005, medium: 0.008, high: 0.012 }, // $ per request (per 1000)
  },
  "sonar-pro": {
    input: { low: 0.003, medium: 0.003, high: 0.003 },
    output: { low: 0.015, medium: 0.015, high: 0.015 },
    perRequest: { low: 0.006, medium: 0.01, high: 0.014 },
  },
  "sonar-reasoning": {
    input: { low: 0.001, medium: 0.001, high: 0.001 },
    output: { low: 0.005, medium: 0.005, high: 0.005 },
    perRequest: { low: 0.005, medium: 0.008, high: 0.012 },
  },
  "sonar-reasoning-pro": {
    input: { low: 0.002, medium: 0.002, high: 0.002 },
    output: { low: 0.008, medium: 0.008, high: 0.008 },
    perRequest: { low: 0.006, medium: 0.01, high: 0.014 },
  },
  "sonar-deep-research": {
    input: { low: 0.002, medium: 0.002, high: 0.002 },
    output: { low: 0.008, medium: 0.008, high: 0.008 },
    perRequest: { low: 0.005, medium: 0.005, high: 0.005 },
    reasoning: 0.003, // $ per 1k reasoning tokens
  },
};

function normalizeModel(
  model: PerplexityModel
): keyof typeof PRICING | undefined {
  const m = model.toLowerCase();
  if (m.startsWith("sonar-deep-research")) return "sonar-deep-research";
  if (m.startsWith("sonar-reasoning-pro")) return "sonar-reasoning-pro";
  if (m.startsWith("sonar-reasoning")) return "sonar-reasoning";
  if (m.startsWith("sonar-pro")) return "sonar-pro";
  if (m.startsWith("sonar")) return "sonar";
  return undefined;
}

function calculatePerplexityCost(
  model: PerplexityModel,
  usage: PerplexityUsage
): CostDetails {
  const modelKey = normalizeModel(model);
  if (!modelKey) {
    throw new Error(`Unknown model: ${model}`);
  }
  const pricing = PRICING[modelKey];
  const searchContextSize = usage.search_context_size || "low";

  // Calculate input/output costs
  const input =
    (usage.prompt_tokens / 1000) *
    pricing.input[searchContextSize as keyof typeof pricing.input];
  const output =
    (usage.completion_tokens / 1000) *
    pricing.output[searchContextSize as keyof typeof pricing.output];
  let totalCost = input + output;

  // Deep research: reasoning tokens
  if (modelKey === "sonar-deep-research" && usage.reasoning_tokens) {
    totalCost +=
      (usage.reasoning_tokens / 1000) *
      ((pricing as (typeof PRICING)["sonar-deep-research"]).reasoning || 0);
  }

  // Per-request cost (not always charged, but included for completeness)
  // Uncomment if you want to add per-request cost:
  // totalCost += pricing.perRequest[context] / 1000;

  // Round to 5 decimals for cents
  return {
    input,
    output,
    total: input + output,
  };
}

export { calculatePerplexityCost, type PerplexityModel, type CostDetails };
