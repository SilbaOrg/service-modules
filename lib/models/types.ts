type LLMProvider = "openai" | "anthropic" | "google" | "deepseek";

interface AnthropicRates {
  readonly inputBase: number;
  readonly cacheWrite5m: number;
  readonly cacheWrite1h: number;
  readonly cacheRead: number;
  readonly output: number;
  readonly batchInput: number;
  readonly batchOutput: number;
}

interface AnthropicFlatPricing {
  readonly kind: "flat";
  readonly rates: AnthropicRates;
}

interface AnthropicPromptLengthPricing {
  readonly kind: "byPromptLength";
  readonly thresholdTokens: number;
  readonly upToThreshold: AnthropicRates;
  readonly overThreshold: AnthropicRates;
}

type AnthropicPricing = AnthropicFlatPricing | AnthropicPromptLengthPricing;

type OpenAIReasoningEffort =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "max";

interface OpenAITierPricing {
  readonly input: number;
  readonly output: number;
  readonly cached: number;
}

/**
 * Above OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS prompt tokens the ENTIRE request
 * reprices at the longContext tier, not just the tokens past the threshold.
 */
interface OpenAIPricing {
  readonly standard: OpenAITierPricing;
  readonly longContext: OpenAITierPricing;
}

interface GooglePricing {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly batchInput: number;
  readonly batchOutput: number;
}

interface GooglePriceStep {
  readonly effectiveFromUtcMs: number;
  readonly pricing: GooglePricing;
}

interface DeepSeekTierPricing {
  readonly inputCacheHit: number;
  readonly inputCacheMiss: number;
  readonly output: number;
}

/**
 * DeepSeek bills at two rates depending on the hour the request is served.
 * Off-peak is exactly half of peak. Both tiers are stored so a caller can
 * report the rate actually charged rather than a single approximation.
 */
interface DeepSeekPricing {
  readonly peak: DeepSeekTierPricing;
  readonly offPeak: DeepSeekTierPricing;
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
  readonly reasoningEfforts: ReadonlyArray<OpenAIReasoningEffort>;
  readonly pricing: OpenAIPricing;
}

interface GoogleModelEntry {
  readonly id: string;
  readonly displayName: string;
  readonly supportsVision: boolean;
  readonly pricing: GooglePricing;
  readonly scheduledPricing: ReadonlyArray<GooglePriceStep>;
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
  AnthropicFlatPricing,
  AnthropicModelEntry,
  AnthropicPricing,
  AnthropicPromptLengthPricing,
  AnthropicRates,
  DeepSeekModelEntry,
  DeepSeekPricing,
  DeepSeekTierPricing,
  GoogleModelEntry,
  GooglePriceStep,
  GooglePricing,
  LLMProvider,
  ModelConfig,
  OpenAIModelEntry,
  OpenAIPricing,
  OpenAIReasoningEffort,
  OpenAITierPricing,
};
