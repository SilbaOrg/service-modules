import type { LLMProvider, ModelConfig } from "./models/types.ts";
import { ANTHROPIC_MODELS } from "./models/anthropic.ts";
import { OPENAI_MODELS } from "./models/openai.ts";
import { GOOGLE_MODELS } from "./models/google.ts";
import {
  getAllModelIds,
  getModelsByProvider,
  isValidModelId,
  modelSupportsVision,
} from "./models/mod.ts";

export type { LLMProvider, ModelConfig };

export {
  getAllModelIds,
  getModelsByProvider,
  isValidModelId,
  modelSupportsVision,
};

function findModel(modelId: string): ModelConfig | undefined {
  const allProviders: ReadonlyArray<LLMProvider> = [
    "openai",
    "anthropic",
    "google",
  ];
  for (const provider of allProviders) {
    const models = getModelsByProvider(provider);
    const found = models.find((m) => m.id === modelId);
    if (found) return found;
  }
  return undefined;
}

export { findModel };

export const LLM_MODELS = {
  openai: OPENAI_MODELS.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    provider: "openai" as const,
  })),
  anthropic: ANTHROPIC_MODELS.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    provider: "anthropic" as const,
  })),
  google: GOOGLE_MODELS.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    provider: "google" as const,
  })),
};
