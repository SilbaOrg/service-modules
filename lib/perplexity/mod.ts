import path from "node:path";
import { createLogger } from "../logger.ts";
import type { ServiceResponse } from "../types.ts";
import { assertApiKey } from "../utilities.ts";

const BASE_URL = "http://perplexity-service:5002";
const PERPLEXITY_API_KEY = assertApiKey(
  Deno.env.get("PERPLEXITY_API_KEY"),
  "PERPLEXITY_API_KEY"
);

// --- Types ---
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
};

interface PerplexityChatResponseChoice {
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
}

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

// --- Logger ---
const logger = createLogger("perplexity-service", { module: "perplexity" });

// --- Pure helpers ---
const buildPerplexityRequestBody = (req: PerplexityChatRequest): string => {
  // Create a copy of the request to avoid modifying the original
  const requestCopy = { ...req };

  return JSON.stringify(requestCopy);
};

const buildPerplexityHeaders = (apiKey: string): Headers => {
  const headers = new Headers({ "Content-Type": "application/json" });

  // Support API key in header
  headers.set("x-api-key", apiKey);

  return headers;
};

const parsePerplexityResponse = async (
  res: Response
): Promise<PerplexityChatResponse> => {
  try {
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    logger.error("Failed to parse Perplexity response", { error: err });
    return {
      success: false,
      error: "Invalid JSON response from Perplexity",
      data: null,
    };
  }
};

const isPerplexitySuccess = (res: PerplexityChatResponse): boolean =>
  !!res && res.success === true && !!res.data;

// --- Main function ---
async function perplexityChat(
  chatRequest: PerplexityChatRequest,
  endpoint = path.join(BASE_URL, "api/v1/perplexity/chat/completions")
): Promise<ServiceResponse<PerplexityChatResponseData>> {
  logger.info("Perplexity chat request", {
    model: chatRequest.model,
    messagesCount: chatRequest.messages.length,
  });

  const body = buildPerplexityRequestBody(chatRequest);
  const headers = buildPerplexityHeaders(PERPLEXITY_API_KEY);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
    });
  } catch (err) {
    logger.error("Perplexity fetch failed", { error: err });
    return {
      success: false,
      error: { code: "FETCH_ERROR", message: String(err) },
    };
  }

  const perplexityRes = await parsePerplexityResponse(res);

  if (!perplexityRes.data) {
    logger.error("Perplexity response received", {
      perplexityRes: JSON.stringify(perplexityRes),
    });
    return {
      success: false,
      data: undefined,
      error: {
        code: "PERPLEXITY_ERROR",
        message: perplexityRes.error || "Unknown error",
      },
    };
  }

  logger.debug("Perplexity response received", {
    perplexityRes: JSON.stringify(perplexityRes),
  });

  if (isPerplexitySuccess(perplexityRes)) {
    logger.info("Perplexity chat success", {
      model: chatRequest.model,
      contextSize: chatRequest.web_search_options.search_context_size,
    });
    return { success: true, data: perplexityRes.data };
  } else {
    logger.warn("Perplexity chat failed", {
      model: chatRequest.model,
      error: perplexityRes.error,
    });
    return {
      success: false,
      error: {
        code: "PERPLEXITY_ERROR",
        message: perplexityRes.error || "Unknown error",
      },
    };
  }
}

export { perplexityChat };
export type {
  PerplexityChatRequest,
  PerplexityChatResponse,
  PerplexityChatResponseData,
  PerplexityUsage,
};
