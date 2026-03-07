type LLMProvider = "openai" | "anthropic" | "google";

interface AnthropicFlatPricing {
  tiered: false;
  inputBase: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
  batchInput: number;
  batchOutput: number;
}

interface AnthropicTieredPricing {
  tiered: true;
  inputBase: number;
  inputBaseOver200k: number;
  output: number;
  outputOver200k: number;
  cacheWrite: number;
  cacheWriteOver200k: number;
  cacheRead: number;
  cacheReadOver200k: number;
  batchInput: number;
  batchOutput: number;
}

type AnthropicPricing = AnthropicFlatPricing | AnthropicTieredPricing;

interface OpenAIFlatPricing {
  tiered: false;
  input: number;
  output: number;
  cached: number;
}

interface OpenAITieredPricing {
  tiered: true;
  input: number;
  inputOverThreshold: number;
  output: number;
  outputOverThreshold: number;
  cached: number;
  cachedOverThreshold: number;
}

type OpenAIPricing = OpenAIFlatPricing | OpenAITieredPricing;

interface GooglePricing {
  input: number;
  output: number;
  cacheRead: number;
  batchInput: number;
  batchOutput: number;
}

interface AnthropicModelEntry {
  id: string;
  displayName: string;
  supportsVision: boolean;
  pricing: AnthropicPricing;
}

interface OpenAIModelEntry {
  id: string;
  displayName: string;
  supportsVision: boolean;
  pricing: OpenAIPricing;
}

interface GoogleModelEntry {
  id: string;
  displayName: string;
  supportsVision: boolean;
  pricing: GooglePricing;
}

interface ModelConfig {
  id: string;
  displayName: string;
  provider: LLMProvider;
}

export type {
  AnthropicFlatPricing,
  AnthropicModelEntry,
  AnthropicPricing,
  AnthropicTieredPricing,
  GoogleModelEntry,
  GooglePricing,
  LLMProvider,
  ModelConfig,
  OpenAIFlatPricing,
  OpenAIModelEntry,
  OpenAIPricing,
  OpenAITieredPricing,
};
