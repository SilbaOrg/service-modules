import type { OpenAIModelEntry } from "./types.ts";

const OPENAI_MODEL_IDS = [
  "gpt-5.2",
  "gpt-5-mini",
  "gpt-5-nano",
] as const;

type OpenAIModelId = typeof OPENAI_MODEL_IDS[number];

const OPENAI_MODELS: ReadonlyArray<OpenAIModelEntry> = [
  {
    id: "gpt-5.2",
    displayName: "GPT 5.2",
    supportsVision: true,
    pricing: {
      input: 1.75,
      output: 14.0,
      cached: 0.175,
    },
  },
  {
    id: "gpt-5-mini",
    displayName: "GPT 5 Mini",
    supportsVision: false,
    pricing: {
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
      input: 0.05,
      output: 0.4,
      cached: 0.005,
    },
  },
];

const OPENAI_ALIASES: ReadonlyMap<string, OpenAIModelId> = new Map([
  ["gpt-5.2-chat-latest", "gpt-5.2"],
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
  resolveOpenAIModelName,
};

export type { OpenAIModelId };
