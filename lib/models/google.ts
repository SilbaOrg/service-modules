import type {
  GoogleModelEntry,
  GooglePriceStep,
  GooglePricing,
} from "./types.ts";
import { GOOGLE_MODEL_ID } from "./ids.ts";

const GOOGLE_MODEL_IDS = [
  GOOGLE_MODEL_ID.GEMINI_4_ARGON,
  GOOGLE_MODEL_ID.GEMINI_3_8_FLASH,
  GOOGLE_MODEL_ID.GEMINI_3_5_FLASH_LITE,
] as const;

type GoogleModelId = typeof GOOGLE_MODEL_IDS[number];

const GOOGLE_MODELS: ReadonlyArray<GoogleModelEntry> = [
  {
    id: GOOGLE_MODEL_ID.GEMINI_4_ARGON,
    displayName: "Gemini 4 Argon",
    supportsVision: true,
    pricing: {
      input: 2.0,
      output: 10.0,
      cacheRead: 0.1,
      batchInput: 1.0,
      batchOutput: 5.0,
    },
    scheduledPricing: [
      {
        effectiveFromUtcMs: Date.UTC(2026, 11, 1),
        pricing: {
          input: 4.0,
          output: 20.0,
          cacheRead: 0.2,
          batchInput: 2.0,
          batchOutput: 10.0,
        },
      },
    ],
  },
  {
    id: GOOGLE_MODEL_ID.GEMINI_3_8_FLASH,
    displayName: "Gemini 3.8 Flash",
    supportsVision: true,
    pricing: {
      input: 0.75,
      output: 3.75,
      cacheRead: 0.075,
      batchInput: 0.375,
      batchOutput: 1.875,
    },
    scheduledPricing: [
      {
        effectiveFromUtcMs: Date.UTC(2027, 0, 1),
        pricing: {
          input: 1.5,
          output: 7.5,
          cacheRead: 0.15,
          batchInput: 0.75,
          batchOutput: 3.75,
        },
      },
    ],
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
    scheduledPricing: [],
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

function laterStep(a: GooglePriceStep, b: GooglePriceStep): GooglePriceStep {
  return b.effectiveFromUtcMs > a.effectiveFromUtcMs ? b : a;
}

function dearerPricing(a: GooglePricing, b: GooglePricing): GooglePricing {
  return b.input > a.input ? b : a;
}

function stepPricing({ pricing }: GooglePriceStep): GooglePricing {
  return pricing;
}

function selectGooglePricing(
  { pricing, scheduledPricing }: GoogleModelEntry,
  at?: Date,
): GooglePricing {
  if (at === undefined) {
    return scheduledPricing.map(stepPricing).reduce(dearerPricing, pricing);
  }
  const atMs = at.getTime();
  const reached = scheduledPricing.filter((step) =>
    step.effectiveFromUtcMs <= atMs
  );
  const [first, ...rest] = reached;
  return first === undefined ? pricing : rest.reduce(laterStep, first).pricing;
}

export {
  findGoogleModel,
  GOOGLE_MODEL_IDS,
  GOOGLE_MODELS,
  selectGooglePricing,
};

export type { GoogleModelId };
