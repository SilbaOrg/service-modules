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
    // GPT-4.5 Series
    { id: "gpt-4.5-preview", displayName: "GPT-4.5 Preview", provider: "openai" },
    
    // GPT-4.1 Series
    { id: "gpt-4.1", displayName: "GPT-4.1", provider: "openai", capabilities: { caching: true } },
    { id: "gpt-4.1-mini", displayName: "GPT-4.1 Mini", provider: "openai", capabilities: { caching: true } },
    { id: "gpt-4.1-nano", displayName: "GPT-4.1 Nano", provider: "openai", capabilities: { caching: true } },
    
    // GPT-4o Series
    { id: "gpt-4o", displayName: "GPT-4o", provider: "openai", capabilities: { webSearch: true, caching: true } },
    { id: "gpt-4o-mini", displayName: "GPT-4o Mini", provider: "openai", capabilities: { webSearch: true, caching: true } },
    
    // GPT-4 Series
    { id: "gpt-4-turbo", displayName: "GPT-4 Turbo", provider: "openai" },
    { id: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo", provider: "openai" },
    
    // Reasoning Models
    { id: "o1", displayName: "o1", provider: "openai", capabilities: { reasoning: true } },
    { id: "o1-mini", displayName: "o1 Mini", provider: "openai", capabilities: { reasoning: true } },
    { id: "o1-pro", displayName: "o1 Pro", provider: "openai", capabilities: { reasoning: true } },
    { id: "o1-preview", displayName: "o1 Preview", provider: "openai", capabilities: { reasoning: true } },
    
    // O3 Series
    { id: "o3", displayName: "o3", provider: "openai", capabilities: { caching: true } },
    { id: "o3-pro", displayName: "o3 Pro", provider: "openai", capabilities: { reasoning: true } },
    { id: "o3-deep-research-2025-06-26", displayName: "o3 Deep Research", provider: "openai", capabilities: { deepResearch: true } },
    
    // O4 Series
    { id: "o4-mini", displayName: "o4 Mini", provider: "openai", capabilities: { caching: true } },
    { id: "o4-mini-deep-research-2025-06-26", displayName: "o4 Mini Deep Research", provider: "openai", capabilities: { deepResearch: true } },
  ],
  
  perplexity: [
    // Sonar Models (Legacy naming)
    { id: "llama-3.1-sonar-small-128k-online", displayName: "Llama 3.1 Sonar Small (128k)", provider: "perplexity" },
    { id: "llama-3.1-sonar-large-128k-online", displayName: "Llama 3.1 Sonar Large (128k)", provider: "perplexity" },
    { id: "llama-3.1-sonar-huge-128k-online", displayName: "Llama 3.1 Sonar Huge (128k)", provider: "perplexity" },
    
    // New Sonar Models
    { id: "sonar", displayName: "Sonar", provider: "perplexity" },
    { id: "sonar-pro", displayName: "Sonar Pro", provider: "perplexity" },
    { id: "sonar-reasoning", displayName: "Sonar Reasoning", provider: "perplexity", capabilities: { reasoning: true } },
    { id: "sonar-reasoning-pro", displayName: "Sonar Reasoning Pro", provider: "perplexity", capabilities: { reasoning: true } },
    { id: "sonar-deep-research", displayName: "Sonar Deep Research", provider: "perplexity", capabilities: { deepResearch: true } },
  ],
  
  mistral: [
    { id: "mistral-tiny", displayName: "Mistral Tiny", provider: "mistral" },
    { id: "mistral-small", displayName: "Mistral Small", provider: "mistral" },
    { id: "mistral-medium", displayName: "Mistral Medium", provider: "mistral" },
    { id: "mistral-large-latest", displayName: "Mistral Large", provider: "mistral" },
    { id: "codestral-latest", displayName: "Codestral", provider: "mistral" },
    { id: "mistral-embed", displayName: "Mistral Embed", provider: "mistral" },
  ],
  
  anthropic: [
    // Claude 3 Series
    { id: "claude-3-haiku-20240307", displayName: "Claude 3 Haiku", provider: "anthropic" },
    { id: "claude-3-sonnet-20240229", displayName: "Claude 3 Sonnet", provider: "anthropic" },
    { id: "claude-3-opus-20240229", displayName: "Claude 3 Opus", provider: "anthropic" },
    
    // Claude 3.5 Series
    { id: "claude-3-5-sonnet-20240620", displayName: "Claude 3.5 Sonnet", provider: "anthropic" },
    { id: "claude-3-5-sonnet-20241022", displayName: "Claude 3.5 Sonnet (Oct 2024)", provider: "anthropic" },
    { id: "claude-3-5-haiku-20241022", displayName: "Claude 3.5 Haiku", provider: "anthropic" },
  ],
};

// Helper function to get models by provider
export function getModelsByProvider(provider: keyof ProviderModels): ModelConfig[] {
  return LLM_MODELS[provider] || [];
}

// Helper function to find a specific model
export function findModel(modelId: string): ModelConfig | undefined {
  for (const provider of Object.keys(LLM_MODELS) as Array<keyof ProviderModels>) {
    const model = LLM_MODELS[provider].find(m => m.id === modelId);
    if (model) return model;
  }
  return undefined;
}

// Helper function to get all models with specific capability
export function getModelsWithCapability(capability: keyof ModelCapabilities): ModelConfig[] {
  const models: ModelConfig[] = [];
  for (const provider of Object.keys(LLM_MODELS) as Array<keyof ProviderModels>) {
    models.push(...LLM_MODELS[provider].filter(m => m.capabilities?.[capability] === true));
  }
  return models;
}