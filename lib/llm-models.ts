import openaiModelsJson from "./models.openai.json" with { type: "json" };
import anthropicModelsJson from "./models.anthropic.json" with { type: "json" };

interface OpenAIModelRaw {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface AnthropicModelRaw {
  type: string;
  id: string;
  display_name: string;
  created_at: string;
}

interface OpenAIModelsResponse {
  object: string;
  data: OpenAIModelRaw[];
}

interface AnthropicModelsResponse {
  data: AnthropicModelRaw[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: "openai" | "anthropic";
  createdAt: Date;
}

const openaiResponse = openaiModelsJson as OpenAIModelsResponse;
const anthropicResponse = anthropicModelsJson as AnthropicModelsResponse;

const OPENAI_CHAT_MODEL_PREFIXES = [
  "gpt-5",
  "gpt-4",
  "gpt-3.5",
  "o1",
  "o3",
  "o4",
  "chatgpt",
];

function isOpenAIChatModel(modelId: string): boolean {
  return OPENAI_CHAT_MODEL_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

function formatOpenAIDisplayName(modelId: string): string {
  return modelId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const OPENAI_MODELS: ModelConfig[] = openaiResponse.data
  .filter((m) => isOpenAIChatModel(m.id))
  .map((m) => ({
    id: m.id,
    displayName: formatOpenAIDisplayName(m.id),
    provider: "openai" as const,
    createdAt: new Date(m.created * 1000),
  }));

const ANTHROPIC_MODELS: ModelConfig[] = anthropicResponse.data.map((m) => ({
  id: m.id,
  displayName: m.display_name,
  provider: "anthropic" as const,
  createdAt: new Date(m.created_at),
}));

const ALL_OPENAI_MODEL_IDS = new Set(openaiResponse.data.map((m) => m.id));
const ALL_ANTHROPIC_MODEL_IDS = new Set(anthropicResponse.data.map((m) => m.id));

export function getModelsByProvider(provider: "openai" | "anthropic"): ModelConfig[] {
  switch (provider) {
    case "openai":
      return OPENAI_MODELS;
    case "anthropic":
      return ANTHROPIC_MODELS;
  }
}

export function isValidModelId(modelId: string, provider: "openai" | "anthropic"): boolean {
  switch (provider) {
    case "openai":
      return ALL_OPENAI_MODEL_IDS.has(modelId);
    case "anthropic":
      return ALL_ANTHROPIC_MODEL_IDS.has(modelId);
  }
}

export function findModel(modelId: string): ModelConfig | undefined {
  const openaiModel = OPENAI_MODELS.find((m) => m.id === modelId);
  if (openaiModel) return openaiModel;

  const anthropicModel = ANTHROPIC_MODELS.find((m) => m.id === modelId);
  if (anthropicModel) return anthropicModel;

  return undefined;
}

export function getAllModelIds(provider: "openai" | "anthropic"): string[] {
  switch (provider) {
    case "openai":
      return Array.from(ALL_OPENAI_MODEL_IDS);
    case "anthropic":
      return Array.from(ALL_ANTHROPIC_MODEL_IDS);
  }
}

export const LLM_MODELS = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
};
