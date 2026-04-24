import type { GoogleModelEntry } from "./types.ts";
import { GOOGLE_MODEL_ID } from "./ids.ts";

const GOOGLE_MODEL_IDS = [
  GOOGLE_MODEL_ID.GEMINI_3_1_PRO_PREVIEW,
  GOOGLE_MODEL_ID.GEMINI_3_FLASH_PREVIEW,
] as const;

type GoogleModelId = typeof GOOGLE_MODEL_IDS[number];

const GOOGLE_MODELS: ReadonlyArray<GoogleModelEntry> = [
  {
    id: GOOGLE_MODEL_ID.GEMINI_3_1_PRO_PREVIEW,
    displayName: "Gemini 3.1 Pro Preview",
    supportsVision: true,
    pricing: {
      input: 2.0,
      output: 12.0,
      cacheRead: 0.2,
      batchInput: 1.0,
      batchOutput: 6.0,
    },
  },
  {
    id: GOOGLE_MODEL_ID.GEMINI_3_FLASH_PREVIEW,
    displayName: "Gemini 3 Flash Preview",
    supportsVision: true,
    pricing: {
      input: 0.5,
      output: 3.0,
      cacheRead: 0.05,
      batchInput: 0.25,
      batchOutput: 1.5,
    },
  },
];

function findGoogleModel(modelName: string): GoogleModelEntry {
  const model = GOOGLE_MODELS.find((m) => m.id === modelName);
  if (!model) {
    throw new Error(
      `Unknown Google model: ${modelName}. Available: ${
        GOOGLE_MODEL_IDS.join(", ")
      }`,
    );
  }
  return model;
}

export {
  findGoogleModel,
  GOOGLE_MODEL_IDS,
  GOOGLE_MODELS,
};

export type { GoogleModelId };
