const OPENAI_MODEL_ID = {
  GPT_6_ASTRA: "gpt-6-astra",
  GPT_6_1_SOL: "gpt-6.1-sol",
  GPT_6_1_TERRA: "gpt-6.1-terra",
  GPT_6_LUNA: "gpt-6-luna",
} as const;

const ANTHROPIC_MODEL_ID = {
  CLAUDE_OPUS_5_5: "claude-opus-5-5",
  CLAUDE_SONNET_5_5: "claude-sonnet-5-5",
  CLAUDE_HAIKU_5_5: "claude-haiku-5-5",
} as const;

const GOOGLE_MODEL_ID = {
  GEMINI_4_ARGON: "gemini-4-argon",
  GEMINI_3_8_FLASH: "gemini-3.8-flash",
  GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite",
} as const;

const DEEPSEEK_MODEL_ID = {
  FLASH: "deepseek-flash",
  V4_PRO: "deepseek-v4-pro",
} as const;

type OpenAIModelIdValue = typeof OPENAI_MODEL_ID[keyof typeof OPENAI_MODEL_ID];
type AnthropicModelIdValue =
  typeof ANTHROPIC_MODEL_ID[keyof typeof ANTHROPIC_MODEL_ID];
type GoogleModelIdValue = typeof GOOGLE_MODEL_ID[keyof typeof GOOGLE_MODEL_ID];
type DeepSeekModelIdValue =
  typeof DEEPSEEK_MODEL_ID[keyof typeof DEEPSEEK_MODEL_ID];

export {
  ANTHROPIC_MODEL_ID,
  DEEPSEEK_MODEL_ID,
  GOOGLE_MODEL_ID,
  OPENAI_MODEL_ID,
};
export type {
  AnthropicModelIdValue,
  DeepSeekModelIdValue,
  GoogleModelIdValue,
  OpenAIModelIdValue,
};
