type LLMProvider = "openai" | "anthropic" | "google" | "deepseek";

interface AnthropicPricing {
  readonly inputBase: number;
  readonly cacheWrite5m: number;
  readonly cacheWrite1h: number;
  readonly cacheRead: number;
  readonly output: number;
  readonly batchInput: number;
  readonly batchOutput: number;
}

interface OpenAIPricing {
  readonly input: number;
  readonly output: number;
  readonly cached: number;
}

interface GooglePricing {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly batchInput: number;
  readonly batchOutput: number;
}

interface DeepSeekPricing {
  readonly inputCacheHit: number;
  readonly inputCacheMiss: number;
  readonly output: number;
}

interface AnthropicModelEntry {
  readonly id: string;
  readonly displayName: string;
  readonly supportsVision: boolean;
  readonly pricing: AnthropicPricing;
}

interface OpenAIModelEntry {
  readonly id: string;
  readonly displayName: string;
  readonly supportsVision: boolean;
  readonly pricing: OpenAIPricing;
}

interface GoogleModelEntry {
  readonly id: string;
  readonly displayName: string;
  readonly supportsVision: boolean;
  readonly pricing: GooglePricing;
}

interface DeepSeekModelEntry {
  readonly id: string;
  readonly displayName: string;
  readonly supportsVision: boolean;
  readonly pricing: DeepSeekPricing;
}

interface ModelConfig {
  readonly id: string;
  readonly displayName: string;
  readonly provider: LLMProvider;
}

export type {
  AnthropicModelEntry,
  AnthropicPricing,
  DeepSeekModelEntry,
  DeepSeekPricing,
  GoogleModelEntry,
  GooglePricing,
  LLMProvider,
  ModelConfig,
  OpenAIModelEntry,
  OpenAIPricing,
};
