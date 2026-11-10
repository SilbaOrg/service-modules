import type {
  OpenAIModelEntry,
  OpenAIReasoningEffort,
  OpenAITierPricing,
} from "./types.ts";
import { OPENAI_MODEL_ID } from "./ids.ts";

const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000;

const OPENAI_MODEL_IDS = [
  OPENAI_MODEL_ID.GPT_6_ASTRA,
  OPENAI_MODEL_ID.GPT_6_1_SOL,
  OPENAI_MODEL_ID.GPT_6_1_TERRA,
  OPENAI_MODEL_ID.GPT_6_LUNA,
] as const;

type OpenAIModelId = typeof OPENAI_MODEL_IDS[number];

const EFFORTS_WITHOUT_NONE: ReadonlyArray<OpenAIReasoningEffort> = [
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];

const EFFORTS_WITH_NONE: ReadonlyArray<OpenAIReasoningEffort> = [
  "none",
  ...EFFORTS_WITHOUT_NONE,
];

const OPENAI_MODELS: ReadonlyArray<OpenAIModelEntry> = [
  {
    id: OPENAI_MODEL_ID.GPT_6_ASTRA,
    displayName: "GPT-6 Astra",
    supportsVision: true,
    reasoningEfforts: EFFORTS_WITHOUT_NONE,
    pricing: {
      standard: { input: 10.0, output: 50.0, cached: 1.0 },
      longContext: { input: 20.0, output: 75.0, cached: 2.0 },
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_6_1_SOL,
    displayName: "GPT-6.1 Sol",
    supportsVision: true,
    reasoningEfforts: EFFORTS_WITHOUT_NONE,
    pricing: {
      standard: { input: 2.0, output: 10.0, cached: 0.1 },
      longContext: { input: 4.0, output: 15.0, cached: 0.2 },
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_6_1_TERRA,
    displayName: "GPT-6.1 Terra",
    supportsVision: true,
    reasoningEfforts: EFFORTS_WITH_NONE,
    pricing: {
      standard: { input: 1.0, output: 5.0, cached: 0.05 },
      longContext: { input: 2.0, output: 7.5, cached: 0.1 },
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_6_LUNA,
    displayName: "GPT-6 Luna",
    supportsVision: true,
    reasoningEfforts: EFFORTS_WITH_NONE,
    pricing: {
      standard: { input: 0.1, output: 0.5, cached: 0.01 },
      longContext: { input: 0.2, output: 0.75, cached: 0.02 },
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

function selectOpenAITier(
  model: OpenAIModelEntry,
  promptTokens: number,
): OpenAITierPricing {
  return promptTokens > OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS
    ? model.pricing.longContext
    : model.pricing.standard;
}

function openAIModelAcceptsEffort(
  model: OpenAIModelEntry,
  effort: string,
): effort is OpenAIReasoningEffort {
  return model.reasoningEfforts.some((accepted) => accepted === effort);
}

export {
  findOpenAIModel,
  OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS,
  OPENAI_MODEL_IDS,
  OPENAI_MODELS,
  openAIModelAcceptsEffort,
  selectOpenAITier,
};

export type { OpenAIModelId };
