import { createLogger } from "../logger.ts";
import type {
  CostDetails,
  OpenAIResponsesRequest,
  OpenAIResponsesResponse,
  ServiceResponse,
} from "../types.ts";
import { assertApiKey } from "../utilities.ts";
import { calculateOpenAICost } from "./cost-calculator.ts";

const OPENAI_API_KEY = assertApiKey(
  Deno.env.get("OPENAI_API_KEY"),
  "OPENAI_API_KEY"
);

const OPENAI_BASE_URL =
  Deno.env.get("OPENAI_SERVICE_URL") || "https://api.openai.com/v1";

// --- Logger ---
const logger = createLogger("openai-service", { module: "openai" });

// --- Pure helpers ---
const buildOpenAIHeaders = (apiKey: string): Headers => {
  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "responses-api",
  });
  return headers;
};

const buildOpenAIRequestBody = (req: OpenAIResponsesRequest): string => {
  return JSON.stringify(req);
};

const parseOpenAIResponse = async (
  res: Response
): Promise<ServiceResponse<OpenAIResponsesResponse>> => {
  try {
    const json = await res.json();

    if (!res.ok) {
      logger.error("OpenAI API error", {
        status: res.status,
        error: JSON.stringify(json),
      });
      return {
        success: false,
        error: {
          code: `OPENAI_ERROR_${res.status}`,
          message: json.error?.message || "Unknown OpenAI error",
          statusCode: res.status,
          details: json.error || json,
        },
      };
    }

    // Debug log to see actual response structure
    logger.debug("OpenAI API raw JSON response", {
      keys: Object.keys(json),
      hasId: !!json.id,
      hasObject: !!json.object,
      object: json.object,
      hasUsage: !!json.usage,
      usageKeys: json.usage ? Object.keys(json.usage) : [],
      hasOutput: !!json.output,
      hasOutputText: !!json.output_text,
      hasChoices: !!json.choices,
      // Log first 500 chars of response to see structure
      preview: JSON.stringify(json).substring(0, 500),
    });

    return { success: true, data: json };
  } catch (err) {
    logger.error("Failed to parse OpenAI response", { error: String(err) });
    return {
      success: false,
      error: {
        code: "PARSE_ERROR",
        message: "Invalid JSON response from OpenAI",
      },
    };
  }
};

// --- Main function ---
async function openAIResponsesCreate(
  request: OpenAIResponsesRequest,
  endpoint = `${OPENAI_BASE_URL}/responses`
): Promise<
  ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>
> {
  logger.info("OpenAI Responses API request", {
    model: request.model,
    hasTools: !!request.tools,
    toolTypes: request.tools?.map((t: any) => t.type).join(","),
    stream: request.stream || false,
  });

  const body = buildOpenAIRequestBody(request);
  const headers = buildOpenAIHeaders(OPENAI_API_KEY);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
    });
  } catch (err) {
    logger.error("OpenAI fetch failed", { error: String(err) });
    return {
      success: false,
      error: { code: "FETCH_ERROR", message: String(err) },
    };
  }

  const openAIRes = await parseOpenAIResponse(res);

  if (!openAIRes.success || !openAIRes.data) {
    return openAIRes as ServiceResponse<
      OpenAIResponsesResponse & { cost_details: CostDetails }
    >;
  }

  // Log the full response for debugging
  logger.debug("OpenAI raw response structure", {
    responseKeys: Object.keys(openAIRes.data),
    hasOutputText: !!openAIRes.data.output_text,
    hasOutput: !!openAIRes.data.output,
    outputLength: openAIRes.data.output?.length,
    usage: openAIRes.data.usage,
  });

  // Log detailed usage information
  logger.info("OpenAI usage data received", {
    model: request.model,
    rawUsage: JSON.stringify(openAIRes.data.usage),
    hasUsage: !!openAIRes.data.usage,
    usageKeys: openAIRes.data.usage ? Object.keys(openAIRes.data.usage) : [],
    inputTokens: openAIRes.data.usage?.input_tokens,
    outputTokens: openAIRes.data.usage?.output_tokens,
    totalTokens: openAIRes.data.usage?.total_tokens,
    promptTokens: openAIRes.data.usage?.prompt_tokens,
    completionTokens: openAIRes.data.usage?.completion_tokens,
  });

  // Calculate costs - map Responses API fields to standard fields
  const mappedUsage = {
    prompt_tokens: openAIRes.data.usage.input_tokens || openAIRes.data.usage.prompt_tokens || 0,
    completion_tokens: openAIRes.data.usage.output_tokens || openAIRes.data.usage.completion_tokens || 0,
    total_tokens: openAIRes.data.usage.total_tokens || 0,
    cached_tokens: openAIRes.data.usage.input_tokens_details?.cached_tokens || 0,
  };

  // Log mapped usage before cost calculation
  logger.info("OpenAI mapped usage for cost calculation", {
    model: request.model,
    mappedPromptTokens: mappedUsage.prompt_tokens,
    mappedCompletionTokens: mappedUsage.completion_tokens,
    mappedTotalTokens: mappedUsage.total_tokens,
    mappedCachedTokens: mappedUsage.cached_tokens,
    mappedUsageJSON: JSON.stringify(mappedUsage),
  });

  // Validate mapped usage
  if (typeof mappedUsage.prompt_tokens !== 'number' || mappedUsage.prompt_tokens < 0) {
    logger.error("Invalid mapped prompt_tokens", {
      model: request.model,
      promptTokens: mappedUsage.prompt_tokens,
      originalUsage: JSON.stringify(openAIRes.data.usage),
    });
  }
  if (typeof mappedUsage.completion_tokens !== 'number' || mappedUsage.completion_tokens < 0) {
    logger.error("Invalid mapped completion_tokens", {
      model: request.model,
      completionTokens: mappedUsage.completion_tokens,
      originalUsage: JSON.stringify(openAIRes.data.usage),
    });
  }
  
  let costDetails;
  try {
    logger.info("Calling calculateOpenAICost", {
      model: request.model,
      promptTokens: mappedUsage.prompt_tokens,
      completionTokens: mappedUsage.completion_tokens,
    });
    
    costDetails = calculateOpenAICost(request.model, mappedUsage);
    
    logger.info("OpenAI cost calculation result", {
      model: request.model,
      costInput: costDetails.input,
      costOutput: costDetails.output,
      costTotal: costDetails.total,
      costDetailsJSON: JSON.stringify(costDetails),
    });
  } catch (error) {
    logger.error("OpenAI cost calculation failed", {
      model: request.model,
      error: String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      mappedUsage: JSON.stringify(mappedUsage),
    });
    throw new Error(`Cost calculation failed for model ${request.model}: ${String(error)}`);
  }

  logger.info("OpenAI Responses API success", {
    model: request.model,
    inputTokens: openAIRes.data.usage.input_tokens || 0,
    outputTokens: openAIRes.data.usage.output_tokens || 0,
    totalTokens: openAIRes.data.usage.total_tokens || 0,
    cost: costDetails.total,
    outputLength: openAIRes.data.output?.length || 0,
  });

  return {
    success: true,
    data: {
      ...openAIRes.data,
      cost_details: costDetails,
    },
  };
}

// --- Convenience functions for specific use cases ---
function openAIDeepResearch(
  prompt: string,
  model: string = "gpt-5.2"
): Promise<
  ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>
> {
  const request: OpenAIResponsesRequest = {
    model,
    input: prompt,
    reasoning: { summary: "none" },
    tools: [{ type: "web_search_preview" }],
  };

  return openAIResponsesCreate(request);
}

function openAIWebSearch(
  prompt: string,
  model: string = "gpt-5.2"
): Promise<
  ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>
> {
  const request: OpenAIResponsesRequest = {
    model,
    input: prompt,
    tools: [{ type: "web_search_preview" }],
  };

  return openAIResponsesCreate(request);
}

export { openAIDeepResearch, openAIResponsesCreate, openAIWebSearch };
