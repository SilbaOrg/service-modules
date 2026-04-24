import type { AnthropicModelEntry } from "./types.ts";
import { ANTHROPIC_MODEL_ID } from "./ids.ts";

const ANTHROPIC_MODEL_IDS = [
  ANTHROPIC_MODEL_ID.CLAUDE_OPUS_4_7,
  ANTHROPIC_MODEL_ID.CLAUDE_SONNET_4_6,
  ANTHROPIC_MODEL_ID.CLAUDE_HAIKU_4_5,
] as const;

type AnthropicModelId = typeof ANTHROPIC_MODEL_IDS[number];

const ANTHROPIC_MODELS: ReadonlyArray<AnthropicModelEntry> = [
  {
    id: ANTHROPIC_MODEL_ID.CLAUDE_OPUS_4_7,
    displayName: "Claude Opus 4.7",
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
    id: ANTHROPIC_MODEL_ID.CLAUDE_SONNET_4_6,
    displayName: "Claude Sonnet 4.6",
    supportsVision: true,
    pricing: {
      inputBase: 3.0,
      cacheWrite5m: 3.75,
      cacheWrite1h: 6.0,
      cacheRead: 0.3,
      output: 15.0,
      batchInput: 1.5,
      batchOutput: 7.5,
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
  ["claude-opus-4-latest", ANTHROPIC_MODEL_ID.CLAUDE_OPUS_4_7],
  ["claude-sonnet-4-latest", ANTHROPIC_MODEL_ID.CLAUDE_SONNET_4_6],
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
