import type {
  CostDetails,
  GoogleModelPricing,
  GoogleTokenPricing,
  GoogleUsage,
} from "../types.ts";

const PRICING: GoogleModelPricing = {
  "gemini-3-pro-preview": {
    input: 2.0,
    output: 12.0,
    cacheRead: 0.2,
    batchInput: 1.0,
    batchOutput: 6.0,
  },

  "gemini-2.5-pro": {
    input: 1.25,
    output: 10.0,
    cacheRead: 0.125,
    batchInput: 0.625,
    batchOutput: 5.0,
  },

  "gemini-2.5-flash": {
    input: 0.3,
    output: 2.5,
    cacheRead: 0.03,
    batchInput: 0.15,
    batchOutput: 1.25,
  },
  "gemini-2.5-flash-preview-09-2025": {
    input: 0.3,
    output: 2.5,
    cacheRead: 0.03,
    batchInput: 0.15,
    batchOutput: 1.25,
  },

  "gemini-2.5-flash-lite": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.01,
    batchInput: 0.05,
    batchOutput: 0.2,
  },
  "gemini-2.5-flash-lite-preview-09-2025": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.01,
    batchInput: 0.05,
    batchOutput: 0.2,
  },

  "gemini-2.0-flash": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.025,
    batchInput: 0.05,
    batchOutput: 0.2,
  },
  "gemini-2.0-flash-001": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.025,
    batchInput: 0.05,
    batchOutput: 0.2,
  },
  "gemini-2.0-flash-exp": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.025,
    batchInput: 0.05,
    batchOutput: 0.2,
  },

  "gemini-2.0-flash-lite": {
    input: 0.075,
    output: 0.3,
    batchInput: 0.0375,
    batchOutput: 0.15,
  },
  "gemini-2.0-flash-lite-001": {
    input: 0.075,
    output: 0.3,
    batchInput: 0.0375,
    batchOutput: 0.15,
  },
  "gemini-2.0-flash-lite-preview": {
    input: 0.075,
    output: 0.3,
    batchInput: 0.0375,
    batchOutput: 0.15,
  },
  "gemini-2.0-flash-lite-preview-02-05": {
    input: 0.075,
    output: 0.3,
    batchInput: 0.0375,
    batchOutput: 0.15,
  },

  "gemini-2.5-computer-use-preview-10-2025": {
    input: 1.25,
    output: 10.0,
  },

  "gemini-robotics-er-1.5-preview": {
    input: 0.3,
    output: 2.5,
  },

  "gemini-exp-1206": {
    input: 1.25,
    output: 10.0,
    cacheRead: 0.125,
    batchInput: 0.625,
    batchOutput: 5.0,
  },

  "gemini-flash-latest": {
    input: 0.3,
    output: 2.5,
    cacheRead: 0.03,
    batchInput: 0.15,
    batchOutput: 1.25,
  },
  "gemini-flash-lite-latest": {
    input: 0.1,
    output: 0.4,
    cacheRead: 0.01,
    batchInput: 0.05,
    batchOutput: 0.2,
  },
  "gemini-pro-latest": {
    input: 1.25,
    output: 10.0,
    cacheRead: 0.125,
    batchInput: 0.625,
    batchOutput: 5.0,
  },
};

const MODEL_ALIASES: Record<string, string> = {
  "gemini-2.5-pro-latest": "gemini-2.5-pro",
  "gemini-2.5-flash-latest": "gemini-2.5-flash",
  "gemini-2.0-flash-latest": "gemini-2.0-flash",
};

function resolveModelName(modelName: string): string {
  return MODEL_ALIASES[modelName] || modelName;
}

function getModelPricing(modelName: string): GoogleTokenPricing {
  const resolvedName = resolveModelName(modelName);
  const pricing = PRICING[resolvedName];

  if (!pricing) {
    throw new Error(`Unknown Google model: ${modelName}`);
  }

  return pricing;
}

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
  if (typeof usage.completion_tokens !== "number" || usage.completion_tokens < 0) {
    throw new Error(`Invalid completion_tokens: ${usage.completion_tokens}`);
  }

  const pricing = getModelPricing(model);

  const inputTokensInMillions = usage.prompt_tokens / 1_000_000;
  const outputTokensInMillions = usage.completion_tokens / 1_000_000;
  const cachedTokensInMillions = (usage.cached_tokens || 0) / 1_000_000;

  let inputCost = 0;
  let outputCost = 0;

  if (usage.batch_mode && pricing.batchInput !== undefined) {
    inputCost = inputTokensInMillions * pricing.batchInput;
  } else if (cachedTokensInMillions > 0 && pricing.cacheRead !== undefined) {
    const nonCachedTokensInMillions =
      inputTokensInMillions - cachedTokensInMillions;
    inputCost =
      nonCachedTokensInMillions * pricing.input +
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

export { calculateGoogleCost, PRICING as GOOGLE_MODEL_PRICING };
