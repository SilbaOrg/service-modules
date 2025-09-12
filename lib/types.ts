// Generic response type
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

// Logging types
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

/**
 * Type for flat log metadata - only allows primitive values
 * This ensures Loki/Grafana can properly parse and index log fields
 */
type FlatLogMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Type guard to check if a value is a primitive (non-object)
 */
function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Validates that metadata contains only flat key-value pairs
 * Throws an error if nested objects are detected
 */
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

// CORS configuration type - Matches oakCors expected format
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
  // shortName: string;
  formalName: string;
  countryAssociated: Country;
  countryAssociatedISO: CountryISO;
};

type SilbaCitation = {
  url: string;
};

// Enhanced type definitions
type PerplexityQueryResult = {
  response: ServiceResponse<PerplexityChatResponseData>;
  latencyMs: number;
  promptIndex: number;
  promptType: string;
  cost_details: CostDetails;
  usage_details: PerplexityUsage;
};

type PerplexityQueryCost = {
  index: number;
  type: string;
  cost: number;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<unknown>;
}

interface PerplexityWebSearchOptions {
  search_context_size: "low" | "medium" | "high";
  user_location?: {
    latitude?: number;
    longitude?: number;
    country: string;
  };
}

interface PerplexitySearchDomainFilter {
  includes?: string[];
  excludes?: string[];
}

interface PerplexityRequestOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  response_format?: Record<string, unknown>;
  web_search_options: PerplexityWebSearchOptions;
}

interface PerplexityChatRequest extends PerplexityRequestOptions {
  model: string;
  messages: PerplexityMessage[];
}

type GenericUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type PerplexityUsage = GenericUsage & {
  search_context_size: "low" | "medium" | "high";
  reasoning_tokens?: number;
  citation_tokens?: number;
};

interface PerplexityChatResponseData {
  id: string;
  model: string;
  usage: PerplexityUsage;
  content: string;
  created: number;
  citations: string[];
  fromCache: boolean;
  relatedQuestions: string[];
}

interface PerplexityChatResponse {
  success: boolean;
  data: PerplexityChatResponseData | null;
  error?: string;
}

// Perplexity API request type
type PerplexityRequest = {
  model: string;
  messages: PerplexityMessage[];
  web_search_options: {
    search_context_size: "low" | "medium" | "high";
  };
  return_related_questions: boolean;
  [key: string]: unknown;
};

// Full Perplexity API response type as returned by the API
interface RawPerplexityApiResponse {
  id: string;
  model: string;
  created: number;
  usage: PerplexityUsage;
  citations?: string[];
  related_questions?: string[];
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }>;
  [key: string]: unknown;
}

// Our simplified response type with only what we need
type StrippedPerplexityChatResponse = {
  id: string;
  model: string;
  created: number;
  usage: PerplexityUsage;
  cost: CostDetails;
  citations: string[];
  relatedQuestions: string[];
  content: string; // Extracted from choices[0].message.content
  fromCache?: boolean; // For tracking if this came from cache
};

type CostDetails = {
  input: number;
  output: number;
  total: number;
  webSearchQueries?: number;
  webSearchQueryCost?: number;
};

/**
 * Token pricing structure for Anthropic models ($ per million tokens)
 *
 * Prompt Caching:
 * - inputBase: Standard input tokens without caching
 * - cacheWrite: Cost to write tokens to cache (5-minute TTL)
 * - cacheRead: Cost to read cached tokens (significant savings)
 *
 * Batch Processing:
 * - batchInput/batchOutput: 50% discount when batch_mode is enabled
 * - Available for all models, processes asynchronously with <1 hour completion
 */
interface AnthropicTokenPricing {
  inputBase: number; // Base input price per million tokens
  cacheWrite: number; // Cache write price per million tokens (5-minute TTL)
  cacheRead: number; // Cache read price per million tokens (major savings)
  output: number; // Output price per million tokens
  batchInput?: number; // Batch input price per million tokens (50% discount)
  batchOutput?: number; // Batch output price per million tokens (50% discount)
}

/**
 * Mapping of model names to their pricing information
 */
interface AnthropicModelPricing {
  [modelName: string]: AnthropicTokenPricing;
}

/**
 * Extended usage information with optional cache and batch mode fields
 *
 * Cache fields are populated when prompt caching is used:
 * - cache_hits: Tokens read from cache (cheap)
 * - cache_writes: Tokens written to cache (more expensive than base input)
 *
 * Batch mode provides 50% discount but processes asynchronously
 */
interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
  cache_hits?: number; // Optional - from prompt caching (5-minute TTL)
  cache_writes?: number; // Optional - from prompt caching
  batch_mode?: boolean; // Optional - if batch processing was used (50% discount)
  web_search_queries?: number; // Optional - count of web search queries performed
}

// Anthropic API Types
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

enum PerplexityModel {
  SONAR = "sonar",
  SONAR_PRO = "sonar-pro",
  SONAR_REASONING = "sonar-reasoning",
  SONAR_REASONING_PRO = "sonar-reasoning-pro",
  SONAR_DEEP_RESEARCH = "sonar-deep-research",
}

// OpenAI Types
enum OpenAIModel {
  // GPT-5 Series
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano",
  GPT_5_CHAT_LATEST = "gpt-5-chat-latest",

  // GPT-4.5
  GPT_4_5_PREVIEW = "gpt-4.5-preview",

  // GPT-4.1 Series
  GPT_4_1 = "gpt-4.1",
  GPT_4_1_MINI = "gpt-4.1-mini",
  GPT_4_1_NANO = "gpt-4.1-nano",

  // GPT-4o Series
  GPT_4O = "gpt-4o",
  GPT_4O_MINI = "gpt-4o-mini",
  GPT_4O_AUDIO_PREVIEW = "gpt-4o-audio-preview",
  GPT_4O_REALTIME_PREVIEW = "gpt-4o-realtime-preview",
  GPT_4O_MINI_AUDIO_PREVIEW = "gpt-4o-mini-audio-preview",
  GPT_4O_MINI_REALTIME_PREVIEW = "gpt-4o-mini-realtime-preview",

  // Reasoning Models
  O1 = "o1",
  O1_MINI = "o1-mini",
  O1_PRO = "o1-pro",
  O3 = "o3",
  O3_MINI = "o3-mini",
  O3_PRO = "o3-pro",
  O4_MINI = "o4-mini",

  // Deep Research Models
  O3_DEEP_RESEARCH = "o3-deep-research",
  O4_MINI_DEEP_RESEARCH = "o4-mini-deep-research",

  // Other Models
  COMPUTER_USE_PREVIEW = "computer-use-preview",
  GPT_IMAGE_1 = "gpt-image-1",
  CODEX_MINI_LATEST = "codex-mini-latest",
  GPT_4O_MINI_SEARCH_PREVIEW = "gpt-4o-mini-search-preview",
  GPT_4O_SEARCH_PREVIEW = "gpt-4o-search-preview",

  // Legacy
  GPT_3_5_TURBO = "gpt-3.5-turbo",
}

type OpenAIUsage = GenericUsage & {
  cached_tokens?: number;
  reasoning_tokens?: number;
  web_search_tokens?: number;
  web_search_queries?: number;
};

// OpenAI Responses API Types
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

// OpenAI Token Pricing ($ per million tokens)
interface OpenAITokenPricing {
  input: number;
  output: number;
  cached?: number;
  webSearchIncluded?: boolean;
}

interface OpenAIModelPricing {
  [modelName: string]: OpenAITokenPricing;
}

//---------------------------------------------------------------

// Type guard for Perplexity chat completion request
function isPerplexityChatRequest(obj: unknown): obj is PerplexityRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "model" in obj &&
    "messages" in obj
  );
}

//---------------------------------------------------------------
// Health Middleware Types

/**
 * Health status enumeration
 */
type HealthStatus = "healthy" | "unhealthy" | "degraded";

/**
 * Enhanced health response with comprehensive metrics
 */
interface EnhancedHealthResponse {
  status: HealthStatus;
  uptime_percentage: number;
  uptime_seconds: number;
  response_time_avg_ms: number;
  response_time_p95_ms: number;
  requests_total: number;
  requests_successful: number;
  success_rate_percentage: number;
  last_restart: string; // ISO 8601 timestamp
  service_specific?: Record<string, string | number | boolean>;
}

//---------------------------------------------------------------

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
  HealthStatus,
  LogEntry,
  LoggerConfig,
  OpenAIModelPricing,
  OpenAIResponsesRequest,
  OpenAIResponsesResponse,
  OpenAITokenPricing,
  OpenAITool,
  OpenAIUsage,
  PerplexityChatRequest,
  PerplexityChatResponse,
  PerplexityChatResponseData,
  PerplexityMessage,
  PerplexityQueryCost,
  PerplexityQueryResult,
  PerplexityRequest,
  PerplexitySearchDomainFilter,
  PerplexityUsage,
  PerplexityWebSearchOptions,
  Prompt,
  PromptPair,
  RawPerplexityApiResponse,
  ServiceResponse,
  SilbaCitation,
  StrippedPerplexityChatResponse,
  SystemPrompt,
  UserPrompt,
};

export {
  LogLevel,
  OpenAIModel,
  PerplexityModel,
  isPerplexityChatRequest,
  validateFlatMetadata,
};
