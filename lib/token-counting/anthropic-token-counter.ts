const ANTHROPIC_TOKEN_COUNT_URL = "https://api.anthropic.com/v1/messages/count_tokens";
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";

function getApiKey(providedKey: string | undefined): string {
  const key = providedKey || Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY not found in environment variables and not provided as parameter");
  }
  return key;
}

function formatApiError(statusCode: number, responseBody: string): string {
  const statusMessage = getHttpStatusMessage(statusCode);

  if (responseBody.trim().startsWith("<!DOCTYPE") || responseBody.trim().startsWith("<html")) {
    return `Anthropic API error: ${statusCode} ${statusMessage} (received HTML error page from gateway)`;
  }

  try {
    const jsonError = JSON.parse(responseBody);
    const errorMessage = jsonError.error?.message || jsonError.message || JSON.stringify(jsonError);
    return `Anthropic API error: ${statusCode} ${statusMessage} - ${errorMessage}`;
  } catch {
    const truncatedBody = responseBody.length > 200 ? responseBody.slice(0, 200) + "..." : responseBody;
    return `Anthropic API error: ${statusCode} ${statusMessage} - ${truncatedBody}`;
  }
}

function getHttpStatusMessage(statusCode: number): string {
  const statusMessages: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    408: "Request Timeout",
    429: "Rate Limited",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusMessages[statusCode] || "Unknown Error";
}

export async function countTokensAnthropic(
  text: string,
  apiKey?: string
): Promise<number> {
  if (typeof text !== "string") {
    throw new Error(`countTokensAnthropic expects a string, got ${typeof text}`);
  }

  if (text.length === 0) {
    return 0;
  }

  const key = getApiKey(apiKey);

  const response = await fetch(ANTHROPIC_TOKEN_COUNT_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(formatApiError(response.status, errorText));
  }

  const data = await response.json();

  if (typeof data.input_tokens !== "number") {
    throw new Error("Invalid response from Anthropic API: missing input_tokens");
  }

  return data.input_tokens;
}

export type TokenCountItem = {
  id: string;
  text: string;
};

export type TokenCountResult = {
  id: string;
  tokens: number;
};

export async function countTokensAnthropicBatch(
  items: Array<TokenCountItem>,
  batchSize: number,
  delayBetweenBatchesMs: number,
  apiKey?: string
): Promise<Array<TokenCountResult>> {
  const key = getApiKey(apiKey);
  const results: Array<TokenCountResult> = [];

  for (let batchStart = 0; batchStart < items.length; batchStart += batchSize) {
    const batch = items.slice(batchStart, batchStart + batchSize);

    const batchPromises = batch.map(async (item) => {
      const tokens = await countTokensAnthropic(item.text, key);
      return { id: item.id, tokens };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    const hasMoreBatches = batchStart + batchSize < items.length;
    if (hasMoreBatches) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatchesMs));
    }
  }

  return results;
}
