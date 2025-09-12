/**
 * Utility to calculate the cost of Anthropic API usage based on token counts
 *
 * Supports all Claude models including the latest Claude 4 generation with features like:
 * - Prompt caching (5-minute TTL with write/read pricing)
 * - Batch processing (50% discount on all models)
 * - Extended thinking (Claude 4 models)
 * - Standard and priority tier pricing
 *
 * Pricing data based on Anthropic documentation as of August 2025
 */

import {
  AnthropicModelPricing,
  AnthropicTokenPricing,
  AnthropicUsage,
} from "../types.ts";

/**
 * Pricing information for each model ($ per million tokens)
 *
 * Model generations:
 * - Claude 4: Latest generation with extended thinking, refusal stop reason
 * - Claude 3.7: High performance with toggleable extended thinking
 * - Claude 3.5: Previous generation intelligent models
 * - Claude 3: Original generation models
 *
 * All models support 200K context window and batch processing (50% discount)
 */
const MODEL_PRICING: AnthropicModelPricing = {
  // Claude 4 - Latest generation models
  "claude-opus-4-1-20250805": {
    inputBase: 15.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
    output: 75.0,
    batchInput: 7.5, // 50% discount
    batchOutput: 37.5, // 50% discount
  },
  "claude-opus-4-20250514": {
    inputBase: 15.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
    output: 75.0,
    batchInput: 7.5, // 50% discount
    batchOutput: 37.5, // 50% discount
  },
  "claude-sonnet-4-20250514": {
    inputBase: 3.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15.0,
    batchInput: 1.5, // 50% discount
    batchOutput: 7.5, // 50% discount
  },

  // Claude 3.7 - High performance with early extended thinking
  "claude-3-7-sonnet-20250219": {
    inputBase: 3.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15.0,
    batchInput: 1.5,
    batchOutput: 7.5,
  },

  // Claude 3.5 - Previous generation intelligent models
  "claude-3-5-haiku-20241022": {
    inputBase: 0.8, // Updated to match documentation
    cacheWrite: 1.0,
    cacheRead: 0.08,
    output: 4.0,
    batchInput: 0.4, // 50% discount
    batchOutput: 2.0, // 50% discount
  },
  "claude-3-5-sonnet-20241022": {
    inputBase: 3.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15.0,
    batchInput: 1.5,
    batchOutput: 7.5,
  },
  "claude-3-5-sonnet-20240620": {
    inputBase: 3.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15.0,
    batchInput: 1.5,
    batchOutput: 7.5,
  },

  // Claude 3 - Original generation models
  "claude-3-opus-20240229": {
    inputBase: 15.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
    output: 75.0,
    batchInput: 7.5,
    batchOutput: 37.5,
  },
  "claude-3-sonnet-20240229": {
    inputBase: 3.0,
    cacheWrite: 3.75,
    cacheRead: 0.3,
    output: 15.0,
    batchInput: 1.5,
    batchOutput: 7.5,
  },
  "claude-3-haiku-20240307": {
    inputBase: 0.25,
    cacheWrite: 0.3,
    cacheRead: 0.03,
    output: 1.25,
    batchInput: 0.125,
    batchOutput: 0.625,
  },
};

/**
 * Model name aliases for convenience
 *
 * Aliases automatically point to the latest snapshot of each model generation.
 * Use specific model IDs in production for consistent behavior.
 */
const MODEL_ALIASES: Record<string, string> = {
  // Claude 4 aliases
  "claude-opus-4-1": "claude-opus-4-1-20250805",
  "claude-opus-4-latest": "claude-opus-4-20250514",
  "claude-opus-4-0": "claude-opus-4-20250514",

  "claude-sonnet-4-0": "claude-sonnet-4-20250514",
  "claude-sonnet-4-latest": "claude-sonnet-4-20250514",

  // Claude 3.7 aliases
  "claude-3-7-sonnet-latest": "claude-3-7-sonnet-20250219",

  // Claude 3.5 aliases
  "claude-3-5-haiku-latest": "claude-3-5-haiku-20241022",
  "claude-3-5-sonnet-latest": "claude-3-5-sonnet-20241022",

  // Claude 3 aliases
  "claude-3-opus-latest": "claude-3-opus-20240229",
};

/**
 * Resolve a model name or alias to its canonical name
 *
 * @param modelName - The model name or alias (e.g., "claude-sonnet-4-0")
 * @returns The canonical model name (e.g., "claude-sonnet-4-20250514")
 */
function resolveModelName(modelName: string): string {
  return MODEL_ALIASES[modelName] || modelName;
}

/**
 * Get pricing for a specific model
 *
 * @param modelName - The name of the model (supports aliases)
 * @returns The pricing information for the model
 * @throws Error if the model is not found
 */
function getModelPricing(modelName: string): AnthropicTokenPricing {
  const resolvedName = resolveModelName(modelName);
  const pricing = MODEL_PRICING[resolvedName];

  if (!pricing) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  return pricing;
}

/**
 * Calculate the cost in USD for Anthropic API usage
 *
 * This function handles all Claude model generations (3, 3.5, 3.7, and 4) with support for:
 *
 * **Prompt Caching** (5-minute TTL):
 * - Cache writes: More expensive than base input, creates cached content
 * - Cache reads: Significant savings, reads from existing cache
 * - Cache operations are subtracted from base input tokens to avoid double-counting
 *
 * **Batch Processing** (50% discount):
 * - Available for all models when batch_mode=true
 * - Processes asynchronously with most batches completing <1 hour
 * - Cannot be combined with prompt caching discounts
 *
 * **Claude 4 Features**:
 * - Extended thinking: Provides summarized reasoning process
 * - Refusal stop reason: New stop reason for safety-declined content
 * - Interleaved thinking: Tool use mixed with extended thinking (beta)
 *
 * @param usage - The usage object from an Anthropic API response
 * @param modelName - The name of the Claude model used (supports aliases)
 * @returns Object with input, output, and total costs in USD
 * @throws Error if required usage data is missing or model is unknown
 */
function calculateAnthropicCost(
  usage: AnthropicUsage,
  modelName: string
): {
  input: number;
  output: number;
  total: number;
  webSearchQueries: number;
  webSearchQueryCost: number;
} {
  // Validate required usage data
  if (!usage.input_tokens && usage.input_tokens !== 0) {
    throw new Error("Missing input_tokens in usage data");
  }

  if (!usage.output_tokens && usage.output_tokens !== 0) {
    throw new Error("Missing output_tokens in usage data");
  }

  // Get pricing for the specified model (resolves aliases)
  const pricing = getModelPricing(modelName);

  // Convert token counts to millions for cost calculation
  const inputTokensInMillions = usage.input_tokens / 1_000_000;
  const outputTokensInMillions = usage.output_tokens / 1_000_000;

  // Initialize cost variables
  let input = 0;
  let output = 0;

  // Calculate input token costs
  if (usage.batch_mode && pricing.batchInput !== undefined) {
    // Batch processing: 50% discount, no prompt caching
    input = inputTokensInMillions * pricing.batchInput;
  } else {
    // Standard processing with potential prompt caching

    // Calculate base input cost (excluding cache operations)
    let baseInputTokens = inputTokensInMillions;

    // Handle prompt caching if present
    if (usage.cache_hits || usage.cache_writes) {
      const cacheHitsInMillions = (usage.cache_hits || 0) / 1_000_000;
      const cacheWritesInMillions = (usage.cache_writes || 0) / 1_000_000;

      // Base input excludes cache operations to avoid double-counting
      baseInputTokens = Math.max(
        0,
        inputTokensInMillions - cacheHitsInMillions - cacheWritesInMillions
      );

      // Add specific costs for cache operations
      input += cacheHitsInMillions * pricing.cacheRead; // Cheap cache reads
      input += cacheWritesInMillions * pricing.cacheWrite; // Expensive cache writes
    }

    // Add base input cost (non-cached tokens)
    input += baseInputTokens * pricing.inputBase;
  }

  // Calculate output token costs
  if (usage.batch_mode && pricing.batchOutput !== undefined) {
    // Batch processing: 50% discount
    output = outputTokensInMillions * pricing.batchOutput;
  } else {
    // Standard processing
    output = outputTokensInMillions * pricing.output;
  }

  // Calculate web search query costs
  // Anthropic charges $10 per 1,000 web searches
  let webSearchQueryCost = 0;
  if (usage.web_search_queries) {
    webSearchQueryCost = (usage.web_search_queries / 1000) * 10.0;
  }

  // Return detailed cost breakdown
  return {
    input,
    output,
    total: input + output + webSearchQueryCost,
    webSearchQueries: usage.web_search_queries || 0,
    webSearchQueryCost,
  };
}

export { calculateAnthropicCost };
export type {
  AnthropicUsage,
  AnthropicModelPricing as ModelPricing,
  AnthropicTokenPricing as TokenPricing,
};
