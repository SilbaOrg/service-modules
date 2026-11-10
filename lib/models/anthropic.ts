import type {
  AnthropicModelEntry,
  AnthropicPricing,
  AnthropicRates,
} from "./types.ts";
import { ANTHROPIC_MODEL_ID } from "./ids.ts";

const ANTHROPIC_MODEL_IDS = [
  ANTHROPIC_MODEL_ID.CLAUDE_OPUS_5_5,
  ANTHROPIC_MODEL_ID.CLAUDE_SONNET_5_5,
  ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_5_5,
] as const;

type AnthropicModelId = typeof ANTHROPIC_MODEL_IDS[number];

const HAIKU_5_5_PROMPT_LENGTH_THRESHOLD_TOKENS = 100_000;

const ANTHROPIC_MODELS: ReadonlyArray<AnthropicModelEntry> = [
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_OPUS_5_5,
    displayName: "Claude Opus 5.5",
    supportsVision: true,
    pricing: {
      kind: "flat",
      rates: {
        inputBase: 4.0,
        cacheWrite5m: 5.0,
        cacheWrite1h: 8.0,
        cacheRead: 0.2,
        output: 20.0,
        batchInput: 2.0,
        batchOutput: 10.0,
      },
    },
  },
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_SONNET_5_5,
    displayName: "Claude Sonnet 5.5",
    supportsVision: true,
    pricing: {
      kind: "flat",
      rates: {
        inputBase: 2.0,
        cacheWrite5m: 2.5,
        cacheWrite1h: 4.0,
        cacheRead: 0.1,
        output: 10.0,
        batchInput: 1.0,
        batchOutput: 5.0,
      },
    },
  },
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_5_5,
    displayName: "Claude Haiku 5.5",
    supportsVision: true,
    pricing: {
      kind: "byPromptLength",
      thresholdTokens: HAIKU_5_5_PROMPT_LENGTH_THRESHOLD_TOKENS,
      upToThreshold: {
        inputBase: 0.1,
        cacheWrite5m: 0.125,
        cacheWrite1h: 0.2,
        cacheRead: 0.01,
        output: 0.5,
        batchInput: 0.05,
        batchOutput: 0.25,
      },
      overThreshold: {
        inputBase: 0.5,
        cacheWrite5m: 0.625,
        cacheWrite1h: 1.0,
        cacheRead: 0.05,
        output: 2.5,
        batchInput: 0.25,
        batchOutput: 1.25,
      },
    },
  },
];

const ANTHROPIC_ALIASES: ReadonlyMap<string, AnthropicModelId> = new Map();

function resolveAnthropicModelName(modelName: string): string {
  return ANTHROPIC_ALIASES.get(modelName) ?? modelName;
}

function findAnthropicModel(modelName: string): AnthropicModelEntry {
  const resolvedName = resolveAnthropicModelName(modelName);
  const model = ANTHROPIC_MODELS.find((m) => m.id === resolvedName);
  if (!model) {
    throw new Error(
      `Unknown Anthropic model: ${modelName}. Available: ${
        ANTHROPIC_MODEL_IDS.join(", ")
      }`,
    );
  }
  return model;
}

function selectAnthropicRates(
  pricing: AnthropicPricing,
  promptTokens: number,
): AnthropicRates {
  switch (pricing.kind) {
    case "flat":
      return pricing.rates;
    case "byPromptLength":
      return promptTokens > pricing.thresholdTokens
        ? pricing.overThreshold
        : pricing.upToThreshold;
  }
}

export {
  ANTHROPIC_ALIASES,
  ANTHROPIC_MODEL_IDS,
  ANTHROPIC_MODELS,
  findAnthropicModel,
  resolveAnthropicModelName,
  selectAnthropicRates,
};

export type { AnthropicModelId };
