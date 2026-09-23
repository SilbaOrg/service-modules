import type { OpenAIModelEntry, OpenAITierPricing } from "./types.ts";
import { OPENAI_MODEL_ID } from "./ids.ts";

/**
 * Prompts longer than this reprice the WHOLE request at the longContext tier
 * (2x input, 1.5x output), not just the tokens past the threshold.
 * Source: developers.openai.com/api/docs/pricing, read 2026-08-22.
 */
const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000;

const OPENAI_MODEL_IDS = [
  OPENAI_MODEL_ID.GPT_6_ASTRA,
  OPENAI_MODEL_ID.GPT_6_SOL,
  OPENAI_MODEL_ID.GPT_6_LUNA,
  OPENAI_MODEL_ID.GPT_5_6_SOL,
  OPENAI_MODEL_ID.GPT_5_6_TERRA,
  OPENAI_MODEL_ID.GPT_5_6_LUNA,
] as const;

type OpenAIModelId = typeof OPENAI_MODEL_IDS[number];

const OPENAI_MODELS: ReadonlyArray<OpenAIModelEntry> = [
  {
    // Flagship. No promotional pricing and no stated end date, unlike Sol.
    // Effort ladder omits "none": low | medium | high | xhigh | max.
    id: OPENAI_MODEL_ID.GPT_6_ASTRA,
    displayName: "GPT-6 Astra",
    supportsVision: true,
    pricing: {
      standard: { input: 10.0, output: 50.0, cached: 1.0 },
      longContext: { input: 20.0, output: 75.0, cached: 2.0 },
    },
  },
  {
    // Source: developers.openai.com/api/docs/pricing, read 2026-09-23.
    id: OPENAI_MODEL_ID.GPT_6_SOL,
    displayName: "GPT-6 Sol",
    supportsVision: true,
    pricing: {
      standard: { input: 2.0, output: 10.0, cached: 0.2 },
      longContext: { input: 4.0, output: 15.0, cached: 0.4 },
    },
  },
  {
    // Cheapest 6-series model and the one image transcription runs on.
    // Vision is declared by the model page's "Image input" feature, not
    // inferred from the family.
    // Source: developers.openai.com/api/docs/pricing, read 2026-09-23.
    id: OPENAI_MODEL_ID.GPT_6_LUNA,
    displayName: "GPT-6 Luna",
    supportsVision: true,
    pricing: {
      standard: { input: 0.1, output: 0.5, cached: 0.01 },
      longContext: { input: 0.2, output: 0.75, cached: 0.02 },
    },
  },
  {
    // Promotional pricing, stated as running at least through 2026-11-21.
    // OpenAI publishes no reversion figure; re-check the pricing page then.
    id: OPENAI_MODEL_ID.GPT_5_6_SOL,
    displayName: "GPT-5.6 Sol",
    supportsVision: true,
    pricing: {
      standard: { input: 4.0, output: 20.0, cached: 0.4 },
      longContext: { input: 8.0, output: 30.0, cached: 0.8 },
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_5_6_TERRA,
    displayName: "GPT-5.6 Terra",
    supportsVision: true,
    pricing: {
      standard: { input: 2.0, output: 12.0, cached: 0.2 },
      longContext: { input: 4.0, output: 18.0, cached: 0.4 },
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_5_6_LUNA,
    displayName: "GPT-5.6 Luna",
    supportsVision: true,
    pricing: {
      standard: { input: 0.2, output: 1.2, cached: 0.02 },
      longContext: { input: 0.4, output: 1.8, cached: 0.04 },
    },
  },
];

function findOpenAIModel(modelName: string): OpenAIModelEntry {
  const model = OPENAI_MODELS.find((m) => m.id === modelName);
  if (!model) {
    throw new Error(
      `Unknown OpenAI model: ${modelName}. Available: ${
        OPENAI_MODEL_IDS.join(", ")
      }`,
    );
  }
  return model;
}

/**
 * The tier that applies to a request whose prompt is `promptTokens` long.
 */
function selectOpenAITier(
  model: OpenAIModelEntry,
  promptTokens: number,
): OpenAITierPricing {
  return promptTokens > OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS
    ? model.pricing.longContext
    : model.pricing.standard;
}

export {
  findOpenAIModel,
  OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS,
  OPENAI_MODEL_IDS,
  OPENAI_MODELS,
  selectOpenAITier,
};

export type { OpenAIModelId };
