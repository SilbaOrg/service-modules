import type { DeepSeekModelEntry } from "./types.ts";
import { DEEPSEEK_MODEL_ID } from "./ids.ts";

const DEEPSEEK_MODEL_IDS = [
  DEEPSEEK_MODEL_ID.V4_FLASH,
  DEEPSEEK_MODEL_ID.V4_PRO,
] as const;

type DeepSeekModelId = typeof DEEPSEEK_MODEL_IDS[number];

const DEEPSEEK_MODELS: ReadonlyArray<DeepSeekModelEntry> = [
  {
    id: DEEPSEEK_MODEL_ID.V4_FLASH,
    displayName: "DeepSeek V4 Flash",
    supportsVision: false,
    pricing: {
      inputCacheHit: 0.0028,
      inputCacheMiss: 0.14,
      output: 0.28,
    },
  },
  {
    id: DEEPSEEK_MODEL_ID.V4_PRO,
    displayName: "DeepSeek V4 Pro",
    supportsVision: false,
    pricing: {
      inputCacheHit: 0.003625,
      inputCacheMiss: 0.435,
      output: 0.87,
    },
  },
];

function findDeepSeekModel(modelName: string): DeepSeekModelEntry {
  const model = DEEPSEEK_MODELS.find((m) => m.id === modelName);
  if (!model) {
    throw new Error(
      `Unknown DeepSeek model: ${modelName}. Available: ${
        DEEPSEEK_MODEL_IDS.join(", ")
      }`,
    );
  }
  return model;
}

export { DEEPSEEK_MODEL_IDS, DEEPSEEK_MODELS, findDeepSeekModel };

export type { DeepSeekModelId };
