import type { OpenAIModelEntry } from "./types.ts";

const OPENAI_TIERED_PRICING_THRESHOLD_TOKENS = 272_000;

const OPENAI_MODEL_IDS = [
  "gpt-5.4",
  "gpt-5-mini",
  "gpt-5-nano",
] as const;

type OpenAIModelId = typeof OPENAI_MODEL_IDS[number];

const OPENAI_MODELS: ReadonlyArray<OpenAIModelEntry> = [
  {
    id: "gpt-5.4",
    displayName: "GPT 5.4",
    supportsVision: true,
    pricing: {
      tiered: true,
      input: 2.5,
      inputOverThreshold: 5.0,
      output: 15.0,
      outputOverThreshold: 22.5,
      cached: 0.25,
      cachedOverThreshold: 0.5,
    },
  },
  {
    id: "gpt-5-mini",
    displayName: "GPT 5 Mini",
    supportsVision: false,
    pricing: {
      tiered: false,
      input: 0.25,
      output: 2.0,
      cached: 0.025,
    },
  },
  {
    id: "gpt-5-nano",
    displayName: "GPT 5 Nano",
    supportsVision: false,
    pricing: {
      tiered: false,
      input: 0.05,
      output: 0.4,
      cached: 0.005,
    },
  },
];

const OPENAI_ALIASES: ReadonlyMap<string, OpenAIModelId> = new Map([
  ["gpt-5.4-2026-03-05", "gpt-5.4"],
]);

function resolveOpenAIModelName(modelName: string): string {
  const fromAlias = OPENAI_ALIASES.get(modelName);
  if (fromAlias) return fromAlias;

  const withoutDateSuffix = modelName.replace(/-\d{4}-\d{2}-\d{2}$/, "");
  const fromAliasAfterNormalize = OPENAI_ALIASES.get(withoutDateSuffix);
  if (fromAliasAfterNormalize) return fromAliasAfterNormalize;

  const matchesKnownModel = OPENAI_MODELS.find(
    (m) => m.id === withoutDateSuffix,
  );
  if (matchesKnownModel) return matchesKnownModel.id;

  return modelName;
}

function findOpenAIModel(modelName: string): OpenAIModelEntry {
  const resolvedName = resolveOpenAIModelName(modelName);
  const model = OPENAI_MODELS.find((m) => m.id === resolvedName);
  if (!model) {
    throw new Error(
      `Unknown OpenAI model: ${modelName}. Available: ${OPENAI_MODEL_IDS.join(", ")}`,
    );
  }
  return model;
}

export {
  findOpenAIModel,
  OPENAI_ALIASES,
  OPENAI_MODEL_IDS,
  OPENAI_MODELS,
  OPENAI_TIERED_PRICING_THRESHOLD_TOKENS,
  resolveOpenAIModelName,
};

export type { OpenAIModelId };
