/**
 * Anthropic Token Counting Utilities
 * Uses Anthropic's official token counting API
 */

/**
 * Count tokens for a given string using Anthropic's token counting API.
 * Uses Claude Sonnet 4.5 as the model for token counting.
 *
 * This is an async operation that makes an API call to Anthropic.
 * Token counting is free but subject to rate limits.
 *
 * @param text - The text to count tokens for
 * @param apiKey - Anthropic API key (if not provided, reads from ANTHROPIC_API_KEY env var)
 * @returns Promise resolving to the number of tokens
 * @throws Error if API key is missing, text is invalid, or API call fails
 */
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

  const key = apiKey || Deno.env.get("ANTHROPIC_API_KEY");

  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY not found in environment variables and not provided as parameter"
    );
  }

  const response = await fetch(
    "https://api.anthropic.com/v1/messages/count_tokens",
    {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (typeof data.input_tokens !== "number") {
    throw new Error(
      "Invalid response from Anthropic API: missing input_tokens"
    );
  }

  return data.input_tokens;
}
