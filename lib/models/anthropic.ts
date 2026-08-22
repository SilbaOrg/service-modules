import type { AnthropicModelEntry } from "./types.ts";
import { ANTHROPIC_MODEL_ID } from "./ids.ts";

const ANTHROPIC_MODEL_IDS = [
  ANTHROPIC_MODEL_ID.CLAUDE_OPUS_5,
  ANTHROPIC_MODEL_ID.CLAUDE_SONNET_5,
  ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_4_5,
] as const;

type AnthropicModelId = typeof ANTHROPIC_MODEL_IDS[number];

const ANTHROPIC_MODELS: ReadonlyArray<AnthropicModelEntry> = [
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_OPUS_5,
    displayName: "Claude Opus 5",
    supportsVision: true,
    pricing: {
      inputBase: 5.0,
      cacheWrite5m: 6.25,
      cacheWrite1h: 10.0,
      cacheRead: 0.5,
      output: 25.0,
      batchInput: 2.5,
      batchOutput: 12.5,
    },
  },
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_SONNET_5,
    displayName: "Claude Sonnet 5",
    supportsVision: true,
    pricing: {
      inputBase: 2.0,
      cacheWrite5m: 2.5,
      cacheWrite1h: 4.0,
      cacheRead: 0.2,
      output: 10.0,
      batchInput: 1.0,
      batchOutput: 5.0,
    },
  },
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_4_5,
    displayName: "Claude Haiku 4.5",
    supportsVision: true,
    pricing: {
      inputBase: 1.0,
      cacheWrite5m: 1.25,
      cacheWrite1h: 2.0,
      cacheRead: 0.1,
      output: 5.0,
      batchInput: 0.5,
      batchOutput: 2.5,
    },
  },
];

const ANTHROPIC_ALIASES: ReadonlyMap<string, AnthropicModelId> = new Map([
  ["claude-haiku-4-5", ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_4_5],
]);

function resolveAnthropicModelName(modelName: string): string {
  return ANTHROPIC_ALIASES.get(modelName) ?? modelName;
}

function findAnthropicModel(modelName: string): AnthropicModelEntry {
  const resolvedName = resolveAnthropicModelName(modelName);
  const model = ANTHROPIC_MODELS.find((m) => m.id === resolvedName);
  if (!model) {
    throw new Error(
      `Unknown Anthropic model: ${modelName}. Available: ${
        ANTHROPIC_MODEL_IDS.join(", ")
      }`,
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
