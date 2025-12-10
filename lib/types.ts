interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    stack?: string;
    statusCode?: number;
    details?: unknown;
  };
}

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LoggerConfig {
  serviceName: string;
  module?: string;
  minLevel: LogLevel;
  format: "json" | "text";
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  module?: string;
  requestId?: string;
  [key: string]: unknown;
}

type FlatLogMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function validateFlatMetadata(metadata: Record<string, unknown>): void {
  Object.entries(metadata).forEach(([key, value]) => {
    if (!isPrimitive(value)) {
      const valueType = Array.isArray(value) ? "array" : "object";
      throw new Error(
        `Nested ${valueType} not allowed in log metadata. ` +
          `Found nested ${valueType} at key '${key}'. ` +
          `Use flat keys instead (e.g., '${key}_id', '${key}_name'). ` +
          `This is required for proper Loki/Grafana integration.`
      );
    }
  });
}

interface CorsConfig {
  origin?:
    | string
    | boolean
    | RegExp
    | (string | RegExp)[]
    | ((ctx: {
        request: { headers: { get: (key: string) => string | null } };
      }) => string);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

type Country = string;
type CountryISO = string;
type Prompt = string;

type SystemPrompt = Prompt;
type UserPrompt = Prompt;

type PromptPair = {
  systemPrompt: SystemPrompt;
  userPrompt: UserPrompt;
};

type CompanyInformation = {
  formalName: string;
  countryAssociated: Country;
  countryAssociatedISO: CountryISO;
};

type SilbaCitation = {
  url: string;
};

type GenericUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type CostDetails = {
  input: number;
  output: number;
  total: number;
  webSearchQueries?: number;
  webSearchQueryCost?: number;
};

interface AnthropicTokenPricing {
  inputBase: number;
  cacheWrite: number;
  cacheRead: number;
  output: number;
  batchInput?: number;
  batchOutput?: number;
}

interface AnthropicModelPricing {
  [modelName: string]: AnthropicTokenPricing;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_hits?: number;
  cache_writes?: number;
  batch_mode?: boolean;
  web_search_queries?: number;
}

type MessageRole = "user" | "assistant";

interface TextContent {
  type: "text";
  text: string;
}

interface ImageSource {
  type: "base64";
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string;
}

interface ImageContent {
  type: "image";
  source: ImageSource;
}

interface ToolUseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultContent {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

type ContentBlock =
  | TextContent
  | ImageContent
  | ToolUseContent
  | ToolResultContent;

interface Message {
  role: MessageRole;
  content: string | ContentBlock[];
}

interface AnthropicChatRequest {
  model: string;
  messages: Message[];
  max_tokens: number;
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
  metadata?: {
    user_id?: string;
  };
}

interface ResponseContent {
  type: "text";
  text: string;
}

interface AnthropicChatResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: ResponseContent[];
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  silba_estimated_cost?: number;
}

enum OpenAIModel {
  GPT_5_1 = "gpt-5.1",
  GPT_5_1_CHAT_LATEST = "gpt-5.1-chat-latest",
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano",
  GPT_5_CHAT_LATEST = "gpt-5-chat-latest",
  GPT_4_5_PREVIEW = "gpt-4.5-preview",
  GPT_4_1 = "gpt-4.1",
  GPT_4_1_MINI = "gpt-4.1-mini",
  GPT_4_1_NANO = "gpt-4.1-nano",
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  GPT_4O_AUDIO_PREVIEW = "gpt-4o-audio-preview",
  GPT_4O_REALTIME_PREVIEW = "gpt-4o-realtime-preview",
  GPT_4O_MINI_AUDIO_PREVIEW = "gpt-4o-mini-audio-preview",
  GPT_4O_MINI_REALTIME_PREVIEW = "gpt-4o-mini-realtime-preview",
  O1 = "o1",
  O1_MINI = "o1-mini",
  O1_PRO = "o1-pro",
  O3 = "o3",
  O3_MINI = "o3-mini",
  O3_PRO = "o3-pro",
  O4_MINI = "o4-mini",
  O3_DEEP_RESEARCH = "o3-deep-research",
  O4_MINI_DEEP_RESEARCH = "o4-mini-deep-research",
  COMPUTER_USE_PREVIEW = "computer-use-preview",
  GPT_IMAGE_1 = "gpt-image-1",
  CODEX_MINI_LATEST = "codex-mini-latest",
  GPT_4O_MINI_SEARCH_PREVIEW = "gpt-4o-mini-search-preview",
  GPT_4O_SEARCH_PREVIEW = "gpt-4o-search-preview",
  GPT_3_5_TURBO = "gpt-3.5-turbo",
}

type OpenAIUsage = GenericUsage & {
  cached_tokens?: number;
  reasoning_tokens?: number;
  web_search_tokens?: number;
  web_search_queries?: number;
};

interface OpenAIToolWebSearch {
  type: "web_search_preview";
}

interface OpenAIToolFileSearch {
  type: "file_search";
}

interface OpenAIToolCodeInterpreter {
  type: "code_interpreter";
  container?: {
    type: "auto";
    file_ids?: string[];
  };
}

type OpenAITool =
  | OpenAIToolWebSearch
  | OpenAIToolFileSearch
  | OpenAIToolCodeInterpreter;

interface OpenAIResponsesRequest {
  model: string;
  input:
    | string
    | Array<{
        role: "developer" | "user" | "assistant";
        content: Array<{
          type: "input_text";
          text: string;
        }>;
      }>;
  tools?: OpenAITool[];
  stream?: boolean;
  reasoning?: {
    summary: "auto" | "none";
  };
  previous_response_id?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

interface OpenAIResponsesResponse {
  id: string;
  object: "response";
  created: number;
  model: string;
  usage: OpenAIUsage;
  output_text?: string;
  output?: Array<{
    content: Array<{
      type: "text";
      text: string;
    }>;
  }>;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
  finish_reason: string;
}

interface OpenAITokenPricing {
  input: number;
  output: number;
  cached?: number;
  webSearchIncluded?: boolean;
}

interface OpenAIModelPricing {
  [modelName: string]: OpenAITokenPricing;
}

type HealthStatus = "healthy" | "unhealthy" | "degraded";

interface EnhancedHealthResponse {
  status: HealthStatus;
  uptime_percentage: number;
  uptime_seconds: number;
  response_time_avg_ms: number;
  response_time_p95_ms: number;
  requests_total: number;
  requests_successful: number;
  success_rate_percentage: number;
  last_restart: string;
  service_specific?: Record<string, string | number | boolean>;
}

export type {
  AnthropicChatRequest,
  AnthropicChatResponse,
  AnthropicModelPricing,
  AnthropicTokenPricing,
  AnthropicUsage,
  CompanyInformation,
  CorsConfig,
  CostDetails,
  EnhancedHealthResponse,
  FlatLogMetadata,
  GenericUsage,
  HealthStatus,
  LogEntry,
  LoggerConfig,
  OpenAIModelPricing,
  OpenAIResponsesRequest,
  OpenAIResponsesResponse,
  OpenAITokenPricing,
  OpenAITool,
  OpenAIUsage,
  Prompt,
  PromptPair,
  ServiceResponse,
  SilbaCitation,
  SystemPrompt,
  UserPrompt,
};

export {
  LogLevel,
  OpenAIModel,
  validateFlatMetadata,
};
