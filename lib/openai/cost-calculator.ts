// OpenAI Cost Calculator
// Calculates the estimated cost in USD for OpenAI API calls
// based on the model, usage, and options, using the official price matrix.

import {
  OpenAIModel,
  type CostDetails,
  type OpenAIModelPricing,
  type OpenAIUsage,
} from "../types.ts";

// Pricing matrix, based on OpenAI pricing as of August 2025
// All prices are per 1 million tokens (Standard tier)
const PRICING: OpenAIModelPricing = {
  // GPT-5 Series (Released August 2025)
  [OpenAIModel.GPT_5]: {
    input: 1.25,
    cached: 0.125,
    output: 10.0,
  },
  [OpenAIModel.GPT_5_MINI]: {
    input: 0.25,
    cached: 0.025,
    output: 2.0,
  },
  [OpenAIModel.GPT_5_NANO]: {
    input: 0.05,
    cached: 0.005,
    output: 0.4,
  },
  [OpenAIModel.GPT_5_CHAT_LATEST]: {
    input: 1.25,
    cached: 0.125,
    output: 10.0,
  },

  // GPT-4.5
  [OpenAIModel.GPT_4_5_PREVIEW]: {
    input: 75.0,
    output: 150.0,
  },

  // GPT-4.1 Series
  [OpenAIModel.GPT_4_1]: {
    input: 2.0,
    cached: 0.5,
    output: 8.0,
  },
  [OpenAIModel.GPT_4_1_MINI]: {
    input: 0.4,
    cached: 0.1,
    output: 1.6,
  },
  [OpenAIModel.GPT_4_1_NANO]: {
    input: 0.1,
    cached: 0.025,
    output: 0.4,
  },

  // GPT-4o Series
  [OpenAIModel.GPT_4O]: {
    input: 2.5,
    cached: 1.25,
    output: 10.0,
  },
  [OpenAIModel.GPT_4O_MINI]: {
    input: 0.15,
    cached: 0.075,
    output: 0.6,
  },
  [OpenAIModel.GPT_4O_AUDIO_PREVIEW]: {
    input: 2.5,
    output: 10.0,
  },
  [OpenAIModel.GPT_4O_REALTIME_PREVIEW]: {
    input: 5.0,
    cached: 2.5,
    output: 20.0,
  },
  [OpenAIModel.GPT_4O_MINI_AUDIO_PREVIEW]: {
    input: 0.15,
    output: 0.6,
  },
  [OpenAIModel.GPT_4O_MINI_REALTIME_PREVIEW]: {
    input: 0.6,
    cached: 0.3,
    output: 2.4,
  },
  [OpenAIModel.GPT_4O_MINI_SEARCH_PREVIEW]: {
    input: 0.15,
    output: 0.6,
  },
  [OpenAIModel.GPT_4O_SEARCH_PREVIEW]: {
    input: 2.5,
    output: 10.0,
  },

  // Reasoning Models
  [OpenAIModel.O1]: {
    input: 15.0,
    cached: 7.5,
    output: 60.0,
  },
  [OpenAIModel.O1_MINI]: {
    input: 1.1,
    cached: 0.55,
    output: 4.4,
  },
  [OpenAIModel.O1_PRO]: {
    input: 150.0,
    output: 600.0,
  },
  [OpenAIModel.O3]: {
    input: 2.0,
    cached: 0.5,
    output: 8.0,
  },
  [OpenAIModel.O3_MINI]: {
    input: 1.1,
    cached: 0.55,
    output: 4.4,
  },
  [OpenAIModel.O3_PRO]: {
    input: 20.0,
    output: 80.0,
  },
  [OpenAIModel.O4_MINI]: {
    input: 1.1,
    cached: 0.275,
    output: 4.4,
  },

  // Deep Research Models
  [OpenAIModel.O3_DEEP_RESEARCH]: {
    input: 10.0,
    cached: 2.5,
    output: 40.0,
  },
  [OpenAIModel.O4_MINI_DEEP_RESEARCH]: {
    input: 2.0,
    cached: 0.5,
    output: 8.0,
  },

  // Other Models
  [OpenAIModel.COMPUTER_USE_PREVIEW]: {
    input: 3.0,
    output: 12.0,
  },
  [OpenAIModel.GPT_IMAGE_1]: {
    input: 5.0,
    cached: 1.25,
    output: 0.0, // Image generation, no text output
  },
  [OpenAIModel.CODEX_MINI_LATEST]: {
    input: 1.5,
    cached: 0.375,
    output: 6.0,
  },

  // Legacy
  [OpenAIModel.GPT_3_5_TURBO]: {
    input: 0.5,
    output: 1.5,
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
  if (modelLower.startsWith("o4-mini-deep-research"))
    return OpenAIModel.O4_MINI_DEEP_RESEARCH;
  if (modelLower.startsWith("o3-deep-research"))
    return OpenAIModel.O3_DEEP_RESEARCH;

  // Regular models
  if (modelLower.startsWith("gpt-4.5")) return OpenAIModel.GPT_4_5_PREVIEW;
  if (modelLower === "gpt-5-mini") return OpenAIModel.GPT_4_1_MINI;
  if (modelLower === "gpt-5-nano") return OpenAIModel.GPT_4_1_NANO;
  if (modelLower === "gpt-5") return OpenAIModel.GPT_4_1;
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

function calculateOpenAICost(model: string, usage: OpenAIUsage): CostDetails {
  // Validate inputs
  if (!model) {
    throw new Error(`Model is required for cost calculation`);
  }
  if (!usage) {
    throw new Error(`Usage data is required for cost calculation`);
  }
  if (typeof usage.prompt_tokens !== "number" || usage.prompt_tokens < 0) {
    throw new Error(`Invalid prompt_tokens: ${usage.prompt_tokens}`);
  }
  if (
    typeof usage.completion_tokens !== "number" ||
    usage.completion_tokens < 0
  ) {
    throw new Error(`Invalid completion_tokens: ${usage.completion_tokens}`);
  }

  const normalizedModel = normalizeModel(model);
  const pricing = PRICING[normalizedModel];

  if (!pricing) {
    const availableModels = Object.keys(PRICING).join(", ");
    throw new Error(
      `Unknown model: ${model} (normalized: ${normalizedModel}). Available models: ${availableModels}`
    );
  }

  // Convert token counts to millions for cost calculation
  const promptTokensInMillions = usage.prompt_tokens / 1_000_000;
  const completionTokensInMillions = usage.completion_tokens / 1_000_000;
  const cachedTokensInMillions = (usage.cached_tokens || 0) / 1_000_000;

  // Calculate input cost
  let inputCost = 0;

  if (cachedTokensInMillions > 0 && pricing.cached !== undefined) {
    // If we have cached tokens and the model supports caching
    const nonCachedTokensInMillions =
      promptTokensInMillions - cachedTokensInMillions;
    inputCost =
      nonCachedTokensInMillions * pricing.input +
      cachedTokensInMillions * pricing.cached;
  } else {
    // Standard input pricing
    inputCost = promptTokensInMillions * pricing.input;
  }

  // Calculate output cost
  const outputCost = completionTokensInMillions * pricing.output;

  // Web search tokens are always charged at the model's input rate
  let webSearchTokenCost = 0;
  if (usage.web_search_tokens) {
    const webSearchTokensInMillions = usage.web_search_tokens / 1_000_000;
    webSearchTokenCost = webSearchTokensInMillions * pricing.input;
  }

  // Web search queries are billed separately
  let webSearchQueryCost = 0;
  if (usage.web_search_queries) {
    // Web search pricing varies by model:
    // - GPT-4o search preview: $30 per 1000 queries
    // - GPT-4o-mini search preview: $25 per 1000 queries  
    // - Other models: Use GPT-4o pricing as default
    let queryPricePerThousand = 30.0; // Default pricing
    
    if (normalizedModel === OpenAIModel.GPT_4O_MINI_SEARCH_PREVIEW) {
      queryPricePerThousand = 25.0;
    } else if (normalizedModel === OpenAIModel.GPT_4O_SEARCH_PREVIEW) {
      queryPricePerThousand = 30.0;
    }
    
    webSearchQueryCost = (usage.web_search_queries / 1000) * queryPricePerThousand;
  }

  // Round to 6 decimals for precision
  const totalCost = inputCost + outputCost + webSearchTokenCost + webSearchQueryCost;
  
  const result = {
    input: Math.round((inputCost + webSearchTokenCost) * 1000000) / 1000000,
    output: Math.round(outputCost * 1000000) / 1000000,
    total: Math.round(totalCost * 1000000) / 1000000,
    webSearchQueries: usage.web_search_queries || 0,
    webSearchQueryCost: Math.round(webSearchQueryCost * 1000000) / 1000000,
  };

  // Validate calculated costs are valid numbers
  if (
    typeof result.input !== "number" ||
    isNaN(result.input) ||
    result.input < 0
  ) {
    throw new Error(`Invalid calculated input cost: ${result.input}`);
  }
  if (
    typeof result.output !== "number" ||
    isNaN(result.output) ||
    result.output < 0
  ) {
    throw new Error(`Invalid calculated output cost: ${result.output}`);
  }
  if (
    typeof result.total !== "number" ||
    isNaN(result.total) ||
    result.total < 0
  ) {
    throw new Error(`Invalid calculated total cost: ${result.total}`);
  }

  return result;
}

export { calculateOpenAICost, PRICING as OPENAI_MODEL_PRICING };
