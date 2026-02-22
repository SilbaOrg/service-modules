export type {
  AnthropicFlatPricing,
  AnthropicModelEntry,
  AnthropicPricing,
  AnthropicTieredPricing,
  GoogleModelEntry,
  GooglePricing,
  LLMProvider,
  ModelConfig,
  OpenAIModelEntry,
  OpenAIPricing,
} from "./types.ts";

export {
  ANTHROPIC_ALIASES,
  ANTHROPIC_MODEL_IDS,
  ANTHROPIC_MODELS,
  findAnthropicModel,
  resolveAnthropicModelName,
} from "./anthropic.ts";
export type { AnthropicModelId } from "./anthropic.ts";

export {
  findOpenAIModel,
  OPENAI_ALIASES,
  OPENAI_MODEL_IDS,
  OPENAI_MODELS,
  resolveOpenAIModelName,
} from "./openai.ts";
export type { OpenAIModelId } from "./openai.ts";

export {
  findGoogleModel,
  GOOGLE_MODEL_IDS,
  GOOGLE_MODELS,
} from "./google.ts";
export type { GoogleModelId } from "./google.ts";

import type { LLMProvider, ModelConfig } from "./types.ts";
import { ANTHROPIC_MODEL_IDS, ANTHROPIC_MODELS } from "./anthropic.ts";
import { OPENAI_MODEL_IDS, OPENAI_MODELS } from "./openai.ts";
import { GOOGLE_MODEL_IDS, GOOGLE_MODELS } from "./google.ts";

function getModelsByProvider(provider: LLMProvider): ReadonlyArray<ModelConfig> {
  switch (provider) {
    case "openai":
      return OPENAI_MODELS.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        provider: "openai" as const,
      }));
    case "anthropic":
      return ANTHROPIC_MODELS.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        provider: "anthropic" as const,
      }));
    case "google":
      return GOOGLE_MODELS.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        provider: "google" as const,
      }));
  }
}

function isValidModelId(modelId: string, provider: LLMProvider): boolean {
  switch (provider) {
    case "openai":
      return (OPENAI_MODEL_IDS as ReadonlyArray<string>).includes(modelId);
    case "anthropic":
      return (ANTHROPIC_MODEL_IDS as ReadonlyArray<string>).includes(modelId);
    case "google":
      return (GOOGLE_MODEL_IDS as ReadonlyArray<string>).includes(modelId);
  }
}

function getAllModelIds(provider: LLMProvider): ReadonlyArray<string> {
  switch (provider) {
    case "openai":
      return OPENAI_MODEL_IDS;
    case "anthropic":
      return ANTHROPIC_MODEL_IDS;
    case "google":
      return GOOGLE_MODEL_IDS;
  }
}

function modelSupportsVision(provider: LLMProvider, modelId: string): boolean {
  switch (provider) {
    case "openai": {
      const model = OPENAI_MODELS.find((m) => m.id === modelId);
      return model ? model.supportsVision : false;
    }
    case "anthropic": {
      const model = ANTHROPIC_MODELS.find((m) => m.id === modelId);
      return model ? model.supportsVision : false;
    }
    case "google": {
      const model = GOOGLE_MODELS.find((m) => m.id === modelId);
      return model ? model.supportsVision : false;
    }
  }
}

export {
  getAllModelIds,
  getModelsByProvider,
  isValidModelId,
  modelSupportsVision,
};
