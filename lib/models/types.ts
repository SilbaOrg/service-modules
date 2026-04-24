type LLMProvider = "openai" | "anthropic" | "google";

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

interface ModelConfig {
  readonly id: string;
  readonly displayName: string;
  readonly provider: LLMProvider;
}

export type {
  AnthropicModelEntry,
  AnthropicPricing,
  GoogleModelEntry,
  GooglePricing,
  LLMProvider,
  ModelConfig,
  OpenAIModelEntry,
  OpenAIPricing,
};
