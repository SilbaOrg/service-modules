// OpenAI Cost Calculator
// Calculates the estimated cost in USD for OpenAI API calls
// based on the model, usage, and options, using the official price matrix.

import {
  type CostDetails,
  type OpenAIUsage,
  OpenAIModel,
  type OpenAIModelPricing,
} from "../types.ts";

// Pricing matrix, based on OpenAI pricing as of July 2025
// All prices are per 1 million tokens
const PRICING: OpenAIModelPricing = {
  // GPT-4.5
  [OpenAIModel.GPT_4_5_PREVIEW]: {
    input: 75.00,
    output: 150.00,
  },
  
  // GPT-4.1 Series
  [OpenAIModel.GPT_4_1]: {
    input: 2.00,
    cached: 0.50,
    output: 8.00,
  },
  [OpenAIModel.GPT_4_1_MINI]: {
    input: 0.40,
    cached: 0.10,
    output: 1.60,
  },
  [OpenAIModel.GPT_4_1_NANO]: {
    input: 0.10,
    cached: 0.025,
    output: 0.40,
  },
  
  // GPT-4o Series
  [OpenAIModel.GPT_4O]: {
    input: 5.00,
    cached: 2.50,
    output: 20.00,
    webSearchIncluded: true,
  },
  [OpenAIModel.GPT_4O_MINI]: {
    input: 0.60,
    cached: 0.30,
    output: 2.40,
    webSearchIncluded: true,
  },
  
  // Reasoning Models
  [OpenAIModel.O1]: {
    input: 15.00,
    output: 60.00,
  },
  [OpenAIModel.O1_MINI]: {
    input: 3.00,
    output: 12.00,
  },
  [OpenAIModel.O1_PRO]: {
    input: 150.00,
    output: 600.00,
  },
  [OpenAIModel.O3]: {
    input: 2.00,
    cached: 0.50,
    output: 8.00,
  },
  [OpenAIModel.O3_PRO]: {
    input: 15.00,
    output: 60.00,
  },
  [OpenAIModel.O4_MINI]: {
    input: 1.10,
    cached: 0.275,
    output: 4.40,
  },
  
  // Deep Research Models
  [OpenAIModel.O3_DEEP_RESEARCH]: {
    input: 10.00,
    output: 40.00,
  },
  [OpenAIModel.O4_MINI_DEEP_RESEARCH]: {
    input: 2.00,
    output: 8.00,
  },
  
  // Legacy
  [OpenAIModel.GPT_3_5_TURBO]: {
    input: 1.50,
    output: 2.00,
  },
};

function normalizeModel(model: string): string {
  // Check if it's already a valid model enum value
  if (Object.values(OpenAIModel).includes(model as OpenAIModel)) {
    return model;
  }
  
  // Handle model names that might have version suffixes
  const modelLower = model.toLowerCase();
  
  // Deep research models
  if (modelLower.startsWith("o4-mini-deep-research")) return OpenAIModel.O4_MINI_DEEP_RESEARCH;
  if (modelLower.startsWith("o3-deep-research")) return OpenAIModel.O3_DEEP_RESEARCH;
  
  // Regular models
  if (modelLower.startsWith("gpt-4.5")) return OpenAIModel.GPT_4_5_PREVIEW;
  if (modelLower === "gpt-4.1-mini") return OpenAIModel.GPT_4_1_MINI;
  if (modelLower === "gpt-4.1-nano") return OpenAIModel.GPT_4_1_NANO;
  if (modelLower === "gpt-4.1") return OpenAIModel.GPT_4_1;
  if (modelLower === "gpt-4o-mini") return OpenAIModel.GPT_4O_MINI;
  if (modelLower === "gpt-4o") return OpenAIModel.GPT_4O;
  if (modelLower === "o1-mini") return OpenAIModel.O1_MINI;
  if (modelLower === "o1-pro") return OpenAIModel.O1_PRO;
  if (modelLower === "o1") return OpenAIModel.O1;
  if (modelLower === "o3-pro") return OpenAIModel.O3_PRO;
  if (modelLower === "o3") return OpenAIModel.O3;
  if (modelLower === "o4-mini") return OpenAIModel.O4_MINI;
  if (modelLower.startsWith("gpt-3.5-turbo")) return OpenAIModel.GPT_3_5_TURBO;
  
  return model; // Return as-is if no match
}

function calculateOpenAICost(
  model: string,
  usage: OpenAIUsage
): CostDetails {
  const normalizedModel = normalizeModel(model);
  const pricing = PRICING[normalizedModel];
  
  if (!pricing) {
    throw new Error(`Unknown model: ${model} (normalized: ${normalizedModel})`);
  }
  
  // Convert token counts to millions for cost calculation
  const promptTokensInMillions = usage.prompt_tokens / 1_000_000;
  const completionTokensInMillions = usage.completion_tokens / 1_000_000;
  const cachedTokensInMillions = (usage.cached_tokens || 0) / 1_000_000;
  
  // Calculate input cost
  let inputCost = 0;
  
  if (cachedTokensInMillions > 0 && pricing.cached !== undefined) {
    // If we have cached tokens and the model supports caching
    const nonCachedTokensInMillions = promptTokensInMillions - cachedTokensInMillions;
    inputCost = (nonCachedTokensInMillions * pricing.input) + (cachedTokensInMillions * pricing.cached);
  } else {
    // Standard input pricing
    inputCost = promptTokensInMillions * pricing.input;
  }
  
  // Calculate output cost
  const outputCost = completionTokensInMillions * pricing.output;
  
  // For models with web search included (GPT-4o series), web search tokens are free
  // For other models, web search tokens are charged at the model's input rate
  if (usage.web_search_tokens && !pricing.webSearchIncluded) {
    const webSearchTokensInMillions = usage.web_search_tokens / 1_000_000;
    inputCost += webSearchTokensInMillions * pricing.input;
  }
  
  // Round to 6 decimals for precision
  return {
    input: Math.round(inputCost * 1000000) / 1000000,
    output: Math.round(outputCost * 1000000) / 1000000,
    total: Math.round((inputCost + outputCost) * 1000000) / 1000000,
  };
}

export { calculateOpenAICost, PRICING as OPENAI_MODEL_PRICING };