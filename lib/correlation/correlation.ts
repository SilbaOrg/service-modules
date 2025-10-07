/**
 * Correlation ID utilities for distributed tracing
 *
 * Correlation IDs allow tracing a single user request across multiple services.
 * The ID is generated at the API entry point and passed through all downstream
 * service calls via the X-Correlation-ID HTTP header.
 *
 * Key principles:
 * - correlation_id is ALWAYS a string, never optional
 * - Entry points generate new IDs if not provided
 * - Middleware extracts or generates IDs
 * - All functions require correlation_id as a parameter
 * - IDs live ONLY in logs, not in database
 *
 * @example Entry point (API route)
 * ```typescript
 * export async function handleRequest(req: Request): Promise<Response> {
 *   const correlationId = extractCorrelationId(req.headers);
 *
 *   logger.info('Request started', {
 *     operation: 'request_start',
 *     correlation_id: correlationId
 *   });
 *
 *   // Pass to downstream services
 *   const headers = addCorrelationHeader(new Headers(), correlationId);
 *   await fetch(downstreamUrl, { headers });
 *
 *   return Response.json({ correlation_id: correlationId });
 * }
 * ```
 *
 * @example Downstream service
 * ```typescript
 * export async function processRequest(req: Request): Promise<Response> {
 *   // Extract ID from upstream
 *   const correlationId = extractCorrelationId(req.headers);
 *
 *   logger.info('Processing', {
 *     operation: 'process_start',
 *     correlation_id: correlationId
 *   });
 *
 *   // All logs use same correlation_id
 *   // Now you can query Seq: filter=correlation_id='abc-123'
 *   // and see the entire flow across all services
 * }
 * ```
 */

/**
 * HTTP header name for correlation ID
 */
export const CORRELATION_HEADER = 'X-Correlation-ID';

/**
 * Generate a new correlation ID
 *
 * Uses crypto.randomUUID() to generate a RFC4122 v4 UUID.
 * This ensures globally unique IDs with extremely low collision probability.
 *
 * @returns A new UUID v4 string
 *
 * @example
 * ```typescript
 * const id = generateCorrelationId();
 * // => "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Extract correlation ID from HTTP headers, or generate new one if not present
 *
 * This function is designed for entry points and middleware. It will:
 * 1. Look for X-Correlation-ID header
 * 2. If found, return it
 * 3. If not found, generate a new ID
 *
 * This means correlation_id is ALWAYS a string, never undefined.
 * Entry points start new traces, downstream services continue existing traces.
 *
 * @param headers - HTTP headers to extract from
 * @returns Correlation ID (extracted or newly generated)
 *
 * @example Entry point (no upstream ID)
 * ```typescript
 * const headers = new Headers();
 * const id = extractCorrelationId(headers);
 * // New ID generated
 * ```
 *
 * @example Downstream service (has upstream ID)
 * ```typescript
 * const headers = new Headers({ 'X-Correlation-ID': 'abc-123' });
 * const id = extractCorrelationId(headers);
 * // Returns 'abc-123'
 * ```
 */
export function extractCorrelationId(headers: Headers): string {
  const id = headers.get(CORRELATION_HEADER);

  if (id) {
    return id;
  }

  // No upstream ID - generate new one
  // This is valid for entry points
  return generateCorrelationId();
}

/**
 * Add correlation ID to HTTP headers
 *
 * Use this when calling downstream services to propagate the correlation ID.
 * This creates a NEW Headers object to avoid mutating the input.
 *
 * @param headers - Existing headers to copy from
 * @param correlationId - Correlation ID to add
 * @returns New Headers object with correlation ID added
 * @throws Error if correlationId is empty string
 *
 * @example
 * ```typescript
 * const correlationId = extractCorrelationId(req.headers);
 * const headers = addCorrelationHeader(new Headers(), correlationId);
 * headers.set('Content-Type', 'application/json');
 *
 * await fetch(downstreamUrl, {
 *   method: 'POST',
 *   headers,
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export function addCorrelationHeader(
  headers: Headers,
  correlationId: string
): Headers {
  if (!correlationId) {
    throw new Error('correlationId is required and cannot be empty');
  }

  const newHeaders = new Headers(headers);
  newHeaders.set(CORRELATION_HEADER, correlationId);
  return newHeaders;
}
