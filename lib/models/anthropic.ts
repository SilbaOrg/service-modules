import type { AnthropicModelEntry } from "./types.ts";

const ANTHROPIC_MODEL_IDS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
] as const;

type AnthropicModelId = typeof ANTHROPIC_MODEL_IDS[number];

const ANTHROPIC_MODELS: ReadonlyArray<AnthropicModelEntry> = [
  {
    id: "claude-opus-4-6",
    displayName: "Claude Opus 4.6",
    supportsVision: true,
    pricing: {
      tiered: true,
      inputBase: 5.0,
      inputBaseOver200k: 10.0,
      output: 25.0,
      outputOver200k: 37.50,
      cacheWrite: 6.25,
      cacheWriteOver200k: 12.50,
      cacheRead: 0.50,
      cacheReadOver200k: 1.0,
      batchInput: 2.5,
      batchOutput: 12.5,
    },
  },
  {
    id: "claude-sonnet-4-6",
    displayName: "Claude Sonnet 4.6",
    supportsVision: true,
    pricing: {
      tiered: true,
      inputBase: 3.0,
      inputBaseOver200k: 6.0,
      output: 15.0,
      outputOver200k: 22.50,
      cacheWrite: 3.75,
      cacheWriteOver200k: 7.50,
      cacheRead: 0.30,
      cacheReadOver200k: 0.60,
      batchInput: 1.5,
      batchOutput: 7.5,
    },
  },
  {
    id: "claude-haiku-4-5-20251001",
    displayName: "Claude Haiku 4.5",
    supportsVision: true,
    pricing: {
      tiered: false,
      inputBase: 1.0,
      output: 5.0,
      cacheWrite: 1.25,
      cacheRead: 0.10,
      batchInput: 0.5,
      batchOutput: 2.5,
    },
  },
];

const ANTHROPIC_ALIASES: ReadonlyMap<string, AnthropicModelId> = new Map([
  ["claude-opus-4-latest", "claude-opus-4-6"],
  ["claude-sonnet-4-latest", "claude-sonnet-4-6"],
  ["claude-haiku-4-5", "claude-haiku-4-5-20251001"],
]);

function resolveAnthropicModelName(modelName: string): string {
  return ANTHROPIC_ALIASES.get(modelName) ?? modelName;
}

function findAnthropicModel(
  modelName: string,
): AnthropicModelEntry {
  const resolvedName = resolveAnthropicModelName(modelName);
  const model = ANTHROPIC_MODELS.find((m) => m.id === resolvedName);
  if (!model) {
    throw new Error(
      `Unknown Anthropic model: ${modelName}. Available: ${ANTHROPIC_MODEL_IDS.join(", ")}`,
    );
  }
  return model;
}

export {
  ANTHROPIC_ALIASES,
  ANTHROPIC_MODEL_IDS,
  ANTHROPIC_MODELS,
  findAnthropicModel,
  resolveAnthropicModelName,
};

export type { AnthropicModelId };
