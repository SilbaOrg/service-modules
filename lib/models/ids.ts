const OPENAI_MODEL_ID = {
  GPT_6_ASTRA: "gpt-6-astra",
  GPT_5_6_SOL: "gpt-5.6-sol",
  GPT_5_6_TERRA: "gpt-5.6-terra",
  GPT_5_6_LUNA: "gpt-5.6-luna",
} as const;

const ANTHROPIC_MODEL_ID = {
  CLAUDE_OPUS_5: "claude-opus-5",
  CLAUDE_SONNET_5: "claude-sonnet-5",
  CLAUDE_HAIKU_4_5: "claude-haiku-4-5-20251001",
} as const;

const GOOGLE_MODEL_ID = {
  GEMINI_3_7_FLASH: "gemini-3.7-flash",
  GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite",
} as const;

const DEEPSEEK_MODEL_ID = {
  V4_FLASH: "deepseek-v4-flash",
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
