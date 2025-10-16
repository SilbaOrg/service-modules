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
      id: "claude-opus-4-1-20250805",
      displayName: "Claude Opus 4.1 (2025-08-05)",
      provider: "anthropic",
    },
    {
      id: "claude-sonnet-4-5-20250929",
      displayName: "Claude Sonnet 4.5 (2025-09-29)",
      provider: "anthropic",
    },
    {
      id: "claude-sonnet-4-20250514",
      displayName: "Claude Sonnet 4.0 (2025-05-14)",
      provider: "anthropic",
    },
    {
      id: "claude-3-7-sonnet-20250219",
      displayName: "Claude 3.7 Sonnet (2025-02-19)",
      provider: "anthropic",
    },
    {
      id: "claude-3-5-sonnet-20241022",
      displayName: "Claude 3.5 Sonnet (2024-10-22)",
      provider: "anthropic",
    },
    {
      id: "claude-haiku-4-5-20251001",
      displayName: "Claude Haiku 4.5 (2025-10-01)",
      provider: "anthropic",
    },
    {
      id: "claude-3-5-haiku-20241022",
      displayName: "Claude Haiku 3.5 (2024-10-22)",
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
