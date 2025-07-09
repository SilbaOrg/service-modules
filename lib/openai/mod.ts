import { createLogger } from "../logger.ts";
import type {
  OpenAIResponsesRequest,
  OpenAIResponsesResponse,
  ServiceResponse,
  CostDetails,
} from "../types.ts";
import { assertApiKey } from "../utilities.ts";
import { calculateOpenAICost } from "./cost-calculator.ts";

const OPENAI_API_KEY = assertApiKey(
  Deno.env.get("OPENAI_API_KEY"),
  "OPENAI_API_KEY"
);

const OPENAI_BASE_URL = Deno.env.get("OPENAI_SERVICE_URL") || "https://api.openai.com/v1";

// --- Logger ---
const logger = createLogger("openai-service", { module: "openai" });

// --- Pure helpers ---
const buildOpenAIHeaders = (apiKey: string): Headers => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "OpenAI-Beta": "responses-api"
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
        error: JSON.stringify(json)
      });
      return {
        success: false,
        error: {
          code: `OPENAI_ERROR_${res.status}`,
          message: json.error?.message || "Unknown OpenAI error"
        }
      };
    }
    
    return { success: true, data: json };
  } catch (err) {
    logger.error("Failed to parse OpenAI response", { error: String(err) });
    return {
      success: false,
      error: {
        code: "PARSE_ERROR",
        message: "Invalid JSON response from OpenAI"
      }
    };
  }
};

// --- Main function ---
async function openAIResponsesCreate(
  request: OpenAIResponsesRequest,
  endpoint = `${OPENAI_BASE_URL}/responses`
): Promise<ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>> {
  logger.info("OpenAI Responses API request", {
    model: request.model,
    hasTools: !!request.tools,
    toolTypes: request.tools?.map(t => t.type).join(","),
    stream: request.stream || false
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
    return openAIRes as ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>;
  }

  // Calculate costs
  const costDetails = calculateOpenAICost(request.model, openAIRes.data.usage);
  
  logger.info("OpenAI Responses API success", {
    model: request.model,
    promptTokens: openAIRes.data.usage.prompt_tokens,
    completionTokens: openAIRes.data.usage.completion_tokens,
    totalTokens: openAIRes.data.usage.total_tokens,
    cost: costDetails.total
  });

  return {
    success: true,
    data: {
      ...openAIRes.data,
      cost_details: costDetails
    }
  };
}

// --- Convenience functions for specific use cases ---
function openAIDeepResearch(
  prompt: string,
  model: string = "o4-mini-deep-research-2025-06-26"
): Promise<ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>> {
  const request: OpenAIResponsesRequest = {
    model,
    input: prompt,
    reasoning: { summary: "auto" },
    tools: [{ type: "web_search_preview" }],
  };
  
  return openAIResponsesCreate(request);
}

function openAIWebSearch(
  prompt: string,
  model: string = "o4-mini"
): Promise<ServiceResponse<OpenAIResponsesResponse & { cost_details: CostDetails }>> {
  const request: OpenAIResponsesRequest = {
    model,
    input: prompt,
    tools: [{ type: "web_search_preview" }],
  };
  
  return openAIResponsesCreate(request);
}

export { openAIResponsesCreate, openAIDeepResearch, openAIWebSearch };