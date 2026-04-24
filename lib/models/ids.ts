const OPENAI_MODEL_ID = {
  GPT_5_5: "gpt-5.5",
  GPT_5_5_PRO: "gpt-5.5-pro",
  GPT_5_4_MINI: "gpt-5.4-mini",
  GPT_5_4_NANO: "gpt-5.4-nano",
} as const;

const ANTHROPIC_MODEL_ID = {
  CLAUDE_OPUS_4_7: "claude-opus-4-7",
  CLAUDE_SONNET_4_6: "claude-sonnet-4-6",
  CLAUDE_HAIKU_4_5: "claude-haiku-4-5-20251001",
} as const;

const GOOGLE_MODEL_ID = {
  GEMINI_3_1_PRO_PREVIEW: "gemini-3.1-pro-preview",
  GEMINI_3_FLASH_PREVIEW: "gemini-3-flash-preview",
} as const;

type OpenAIModelIdValue =
  typeof OPENAI_MODEL_ID[keyof typeof OPENAI_MODEL_ID];
type AnthropicModelIdValue =
  typeof ANTHROPIC_MODEL_ID[keyof typeof ANTHROPIC_MODEL_ID];
type GoogleModelIdValue =
  typeof GOOGLE_MODEL_ID[keyof typeof GOOGLE_MODEL_ID];

export { ANTHROPIC_MODEL_ID, GOOGLE_MODEL_ID, OPENAI_MODEL_ID };
export type {
  AnthropicModelIdValue,
  GoogleModelIdValue,
  OpenAIModelIdValue,
};
