import path from "node:path";
import { createLogger } from "../logger.ts";
import type { ServiceResponse } from "../types.ts";
import { assertApiKey } from "../utilities.ts";

const BASE_URL = "http://firecrawl-service:5001/";

const FIRECRAWL_API_KEY = assertApiKey(
  Deno.env.get("FIRECRAWL_API_KEY"),
  "FIRECRAWL_API_KEY"
);

// --- Types ---
export interface FirecrawlScrapeRequest {
  url: string;
  formats?: string[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  headers?: Record<string, string>;
  waitFor?: number;
  timeout?: number;
  jsonOptions?: Record<string, unknown>;
  actions?: unknown[];
  agent?: string | Record<string, unknown>;
}

export interface FirecrawlScrapeResponseData {
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data?: FirecrawlScrapeResponseData;
  fromCache?: boolean;
  error?: string;
}

// --- Logger ---
const logger = createLogger("firecrawl-service", { module: "firecrawl" });

// --- Pure helpers ---
export const buildFirecrawlRequestBody = (
  req: FirecrawlScrapeRequest
): string => JSON.stringify(req);

export const buildFirecrawlHeaders = (apiKey: string): Headers => {
  const headers = new Headers({ "Content-Type": "application/json" });
  // Optionally support API key in header
  if (apiKey) headers.set("x-api-key", apiKey);
  return headers;
};

export const parseFirecrawlResponse = async (
  res: Response
): Promise<FirecrawlScrapeResponse> => {
  try {
    const json = await res.json();
    return json;
  } catch (err) {
    logger.error("Failed to parse Firecrawl response", { error: err });
    return { success: false, error: "Invalid JSON response from Firecrawl" };
  }
};

export const isFirecrawlSuccess = (res: FirecrawlScrapeResponse): boolean =>
  !!res && res.success === true && !!res.data;

// --- Main function ---
export async function firecrawlScrape(
  req: FirecrawlScrapeRequest,
  endpoint = path.join(BASE_URL, "api/v1/firecrawl/scrape")
): Promise<ServiceResponse<FirecrawlScrapeResponseData>> {
  logger.info("Firecrawl scrape request", {
    url: req.url,
    formats: req.formats,
  });
  const body = buildFirecrawlRequestBody(req);
  const headers = buildFirecrawlHeaders(FIRECRAWL_API_KEY);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
    });
  } catch (err) {
    logger.error("Firecrawl fetch failed", { error: err });
    return {
      success: false,
      error: { code: "FETCH_ERROR", message: String(err) },
    };
  }

  const firecrawlRes = await parseFirecrawlResponse(res);
  if (isFirecrawlSuccess(firecrawlRes)) {
    logger.info("Firecrawl scrape success", { url: req.url });
    return { success: true, data: firecrawlRes.data };
  } else {
    logger.warn("Firecrawl scrape failed", {
      url: req.url,
      error: firecrawlRes.error,
    });
    return {
      success: false,
      error: {
        code: "FIRECRAWL_ERROR",
        message: firecrawlRes.error || "Unknown error",
      },
    };
  }
}
