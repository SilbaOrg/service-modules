import type { GoogleModelEntry } from "./types.ts";
import { GOOGLE_MODEL_ID } from "./ids.ts";

const GOOGLE_MODEL_IDS = [
  GOOGLE_MODEL_ID.GEMINI_3_7_FLASH,
  GOOGLE_MODEL_ID.GEMINI_3_5_FLASH_LITE,
] as const;

type GoogleModelId = typeof GOOGLE_MODEL_IDS[number];

const GOOGLE_MODELS: ReadonlyArray<GoogleModelEntry> = [
  {
    // Introductory pricing. Doubles to 1.50 / 7.50 on 2027-01-01.
    id: GOOGLE_MODEL_ID.GEMINI_3_7_FLASH,
    displayName: "Gemini 3.7 Flash",
    supportsVision: true,
    pricing: {
      input: 0.75,
      output: 3.75,
      cacheRead: 0.075,
      batchInput: 0.375,
      batchOutput: 1.875,
    },
  },
  {
    id: GOOGLE_MODEL_ID.GEMINI_3_5_FLASH_LITE,
    displayName: "Gemini 3.5 Flash-Lite",
    supportsVision: true,
    pricing: {
      input: 0.30,
      output: 2.50,
      cacheRead: 0.03,
      batchInput: 0.15,
      batchOutput: 1.25,
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

export { findGoogleModel, GOOGLE_MODEL_IDS, GOOGLE_MODELS };

export type { GoogleModelId };
