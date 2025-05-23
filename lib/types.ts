// Generic response type
interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    stack?: string;
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
  search_domain_filter?: PerplexitySearchDomainFilter[];
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

type PerplexityUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
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

export type {
  PerplexityQueryResult,
  PerplexityQueryCost,
  CompanyInformation,
  SilbaCitation,
  PromptPair,
  SystemPrompt,
  UserPrompt,
  Prompt,
  LoggerConfig,
  LogEntry,
  ServiceResponse,
  CorsConfig,
  PerplexityRequest,
  RawPerplexityApiResponse,
  StrippedPerplexityChatResponse,
  PerplexityChatRequest,
  PerplexityChatResponse,
  PerplexityChatResponseData,
  PerplexityUsage,
  PerplexityMessage,
  PerplexityWebSearchOptions,
  PerplexitySearchDomainFilter,
  CostDetails,
  AnthropicUsage,
  AnthropicModelPricing,
  AnthropicTokenPricing,
  AnthropicChatRequest,
  AnthropicChatResponse,
};

export { LogLevel, isPerplexityChatRequest };
