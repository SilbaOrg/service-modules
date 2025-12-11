import openaiModelsJson from "./models.openai.json" with { type: "json" };
import anthropicModelsJson from "./models.anthropic.json" with { type: "json" };
import googleModelsJson from "./models.google.json" with { type: "json" };

type LLMProvider = "openai" | "anthropic" | "google";

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

interface GoogleModelRaw {
  name: string;
  version: string;
  displayName: string;
  description?: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTemperature?: number;
  thinking?: boolean;
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

interface GoogleModelsResponse {
  models: GoogleModelRaw[];
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: LLMProvider;
  createdAt: Date;
}

export type { LLMProvider };

const openaiResponse = openaiModelsJson as OpenAIModelsResponse;
const anthropicResponse = anthropicModelsJson as AnthropicModelsResponse;
const googleResponse = googleModelsJson as GoogleModelsResponse;

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

function isGoogleChatModel(model: GoogleModelRaw): boolean {
  return model.supportedGenerationMethods.includes("generateContent");
}

function extractGoogleModelId(name: string): string {
  return name.replace(/^models\//, "");
}

const GOOGLE_MODELS: ModelConfig[] = googleResponse.models
  .filter((m) => isGoogleChatModel(m))
  .map((m) => ({
    id: extractGoogleModelId(m.name),
    displayName: m.displayName,
    provider: "google" as const,
    createdAt: new Date(0),
  }));

const ALL_OPENAI_MODEL_IDS = new Set(openaiResponse.data.map((m) => m.id));
const ALL_ANTHROPIC_MODEL_IDS = new Set(anthropicResponse.data.map((m) => m.id));
const ALL_GOOGLE_MODEL_IDS = new Set(
  googleResponse.models
    .filter((m) => isGoogleChatModel(m))
    .map((m) => extractGoogleModelId(m.name))
);

export function getModelsByProvider(provider: LLMProvider): ModelConfig[] {
  switch (provider) {
    case "openai":
      return OPENAI_MODELS;
    case "anthropic":
      return ANTHROPIC_MODELS;
    case "google":
      return GOOGLE_MODELS;
  }
}

export function isValidModelId(modelId: string, provider: LLMProvider): boolean {
  switch (provider) {
    case "openai":
      return ALL_OPENAI_MODEL_IDS.has(modelId);
    case "anthropic":
      return ALL_ANTHROPIC_MODEL_IDS.has(modelId);
    case "google":
      return ALL_GOOGLE_MODEL_IDS.has(modelId);
  }
}

export function findModel(modelId: string): ModelConfig | undefined {
  const openaiModel = OPENAI_MODELS.find((m) => m.id === modelId);
  if (openaiModel) return openaiModel;

  const anthropicModel = ANTHROPIC_MODELS.find((m) => m.id === modelId);
  if (anthropicModel) return anthropicModel;

  const googleModel = GOOGLE_MODELS.find((m) => m.id === modelId);
  if (googleModel) return googleModel;

  return undefined;
}

export function getAllModelIds(provider: LLMProvider): string[] {
  switch (provider) {
    case "openai":
      return Array.from(ALL_OPENAI_MODEL_IDS);
    case "anthropic":
      return Array.from(ALL_ANTHROPIC_MODEL_IDS);
    case "google":
      return Array.from(ALL_GOOGLE_MODEL_IDS);
  }
}

export const LLM_MODELS = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
};
