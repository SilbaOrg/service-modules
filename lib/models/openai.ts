import type { OpenAIModelEntry } from "./types.ts";
import { OPENAI_MODEL_ID } from "./ids.ts";

const OPENAI_MODEL_IDS = [
  OPENAI_MODEL_ID.GPT_5_5,
  OPENAI_MODEL_ID.GPT_5_5_PRO,
  OPENAI_MODEL_ID.GPT_5_4_MINI,
  OPENAI_MODEL_ID.GPT_5_4_NANO,
] as const;

type OpenAIModelId = typeof OPENAI_MODEL_IDS[number];

const OPENAI_MODELS: ReadonlyArray<OpenAIModelEntry> = [
  {
    id: OPENAI_MODEL_ID.GPT_5_5,
    displayName: "GPT-5.5",
    supportsVision: true,
    pricing: {
      input: 5.0,
      output: 30.0,
      cached: 0.5,
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_5_5_PRO,
    displayName: "GPT-5.5 Pro",
    supportsVision: true,
    pricing: {
      input: 30.0,
      output: 180.0,
      cached: 3.0,
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_5_4_MINI,
    displayName: "GPT-5.4 Mini",
    supportsVision: true,
    pricing: {
      input: 0.75,
      output: 4.5,
      cached: 0.075,
    },
  },
  {
    id: OPENAI_MODEL_ID.GPT_5_4_NANO,
    displayName: "GPT-5.4 Nano",
    supportsVision: false,
    pricing: {
      input: 0.2,
      output: 1.25,
      cached: 0.02,
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

export {
  findOpenAIModel,
  OPENAI_MODEL_IDS,
  OPENAI_MODELS,
};

export type { OpenAIModelId };
