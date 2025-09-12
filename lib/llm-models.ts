// Centralized LLM Models Configuration
// This module provides a single source of truth for all LLM models
// across the Silba ecosystem

export interface ModelCapabilities {
  webSearch?: boolean;
  reasoning?: boolean;
  deepResearch?: boolean;
  caching?: boolean;
}

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: "openai" | "perplexity" | "mistral" | "anthropic";
  capabilities?: ModelCapabilities;
}

export type ProviderModels = {
  openai: ModelConfig[];
  perplexity: ModelConfig[];
  mistral: ModelConfig[];
  anthropic: ModelConfig[];
};

export const LLM_MODELS: ProviderModels = {
  openai: [
    // GPT-5 Series - Latest OpenAI Models
    {
      id: "gpt-5",
      displayName: "GPT-5",
      provider: "openai",
      capabilities: { caching: true },
    },
    {
      id: "gpt-5-mini",
      displayName: "GPT-5 Mini",
      provider: "openai",
      capabilities: { caching: true },
    },
    {
      id: "gpt-5-nano",
      displayName: "GPT-5 Nano",
      provider: "openai",
      capabilities: { caching: true },
    },
  ],

  perplexity: [
    // Sonar Models (Legacy naming)
    {
      id: "llama-3.1-sonar-small-128k-online",
      displayName: "Llama 3.1 Sonar Small (128k)",
      provider: "perplexity",
    },
    {
      id: "llama-3.1-sonar-large-128k-online",
      displayName: "Llama 3.1 Sonar Large (128k)",
      provider: "perplexity",
    },
    {
      id: "llama-3.1-sonar-huge-128k-online",
      displayName: "Llama 3.1 Sonar Huge (128k)",
      provider: "perplexity",
    },

    // New Sonar Models
    { id: "sonar", displayName: "Sonar", provider: "perplexity" },
    { id: "sonar-pro", displayName: "Sonar Pro", provider: "perplexity" },
    {
      id: "sonar-reasoning",
      displayName: "Sonar Reasoning",
      provider: "perplexity",
      capabilities: { reasoning: true },
    },
    {
      id: "sonar-reasoning-pro",
      displayName: "Sonar Reasoning Pro",
      provider: "perplexity",
      capabilities: { reasoning: true },
    },
    {
      id: "sonar-deep-research",
      displayName: "Sonar Deep Research",
      provider: "perplexity",
      capabilities: { deepResearch: true },
    },
  ],

  mistral: [
    { id: "mistral-tiny", displayName: "Mistral Tiny", provider: "mistral" },
    { id: "mistral-small", displayName: "Mistral Small", provider: "mistral" },
    {
      id: "mistral-medium",
      displayName: "Mistral Medium",
      provider: "mistral",
    },
    {
      id: "mistral-large-latest",
      displayName: "Mistral Large",
      provider: "mistral",
    },
    { id: "codestral-latest", displayName: "Codestral", provider: "mistral" },
    { id: "mistral-embed", displayName: "Mistral Embed", provider: "mistral" },
  ],

  anthropic: [
    // Latest Claude Models
    {
      id: "claude-opus-4-1",
      displayName: "Claude Opus 4.1",
      provider: "anthropic",
    },
    {
      id: "claude-sonnet-4-0",
      displayName: "Claude Sonnet 4.0",
      provider: "anthropic",
    },
    {
      id: "claude-3-5-haiku-latest",
      displayName: "Claude Haiku 3.5",
      provider: "anthropic",
    },
  ],
};

// Helper function to get models by provider
export function getModelsByProvider(
  provider: keyof ProviderModels
): ModelConfig[] {
  return LLM_MODELS[provider] || [];
}

// Helper function to find a specific model
export function findModel(modelId: string): ModelConfig | undefined {
  for (const provider of Object.keys(LLM_MODELS) as Array<
    keyof ProviderModels
  >) {
    const model = LLM_MODELS[provider].find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

// Helper function to get all models with specific capability
export function getModelsWithCapability(
  capability: keyof ModelCapabilities
): ModelConfig[] {
  const models: ModelConfig[] = [];
  for (const provider of Object.keys(LLM_MODELS) as Array<
    keyof ProviderModels
  >) {
    models.push(
      ...LLM_MODELS[provider].filter(
        (m) => m.capabilities?.[capability] === true
      )
    );
  }
  return models;
}
