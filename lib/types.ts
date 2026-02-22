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

interface GoogleUsage {
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens?: number;
  batch_mode?: boolean;
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
  AnthropicUsage,
  CompanyInformation,
  CorsConfig,
  CostDetails,
  EnhancedHealthResponse,
  FlatLogMetadata,
  GenericUsage,
  GoogleUsage,
  HealthStatus,
  LogEntry,
  LoggerConfig,
  OpenAIResponsesRequest,
  OpenAIResponsesResponse,
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
  validateFlatMetadata,
};
