/**
 * Document context utilities for structured logging
 *
 * Provides type-safe helpers for logging document-related operations.
 * Enforces that url_hash and original_url are ALWAYS logged together.
 *
 * Key principle: If you log one, you must log both.
 * This makes Seq queries reliable - you can search by either field
 * and always get complete results.
 *
 * @example Using document context
 * ```typescript
 * const docContext = createDocumentContext(urlHash, originalUrl);
 *
 * logger.info('PDF processing started', {
 *   operation: 'pdf_processing_start',
 *   correlation_id: correlationId,
 *   ...docContext  // Both url_hash AND original_url
 * });
 * ```
 *
 * @example Compile-time safety
 * ```typescript
 * // ❌ This will throw at runtime
 * createDocumentContext('', 'https://example.com');
 * // Error: urlHash is required
 *
 * // ❌ This will throw at runtime
 * createDocumentContext('abc123', '');
 * // Error: originalUrl is required
 *
 * // ✅ This works
 * createDocumentContext('abc123', 'https://example.com');
 * // Returns { url_hash: 'abc123', original_url: 'https://example.com' }
 * ```
 */

/**
 * Document identification context
 *
 * Always contains BOTH url_hash and original_url.
 * Use this for all document-related log entries.
 */
export interface DocumentContext {
  /**
   * Hash of the document URL (typically first 16 chars of SHA-256)
   * Used as a shorter identifier for documents in logs
   */
  readonly url_hash: string;

  /**
   * Full original URL of the document
   * The actual URL from which the document was fetched
   */
  readonly original_url: string;
}

/**
 * Create document context for logging
 *
 * Enforces that both url_hash and original_url are provided.
 * This ensures consistency across all document-related logs.
 *
 * The function validates inputs and throws explicit errors if either
 * field is missing. This is intentional - we want to catch missing
 * data early, not silently accept it with defaults.
 *
 * @param urlHash - Hash of the document URL (must be non-empty)
 * @param originalUrl - Full document URL (must be non-empty)
 * @returns DocumentContext object with both fields
 * @throws Error if either parameter is empty or falsy
 *
 * @example Basic usage
 * ```typescript
 * const docContext = createDocumentContext(
 *   'c750235cdf10737e',
 *   'https://www.example.com/doc.pdf'
 * );
 *
 * logger.info('Processing document', {
 *   operation: 'document_process',
 *   correlation_id: correlationId,
 *   ...docContext
 * });
 * ```
 *
 * @example In cache operations
 * ```typescript
 * const urlHash = await computeHash(url);
 * const docContext = createDocumentContext(urlHash, url);
 *
 * logger.info('Cache lookup', {
 *   operation: 'cache_lookup_start',
 *   correlation_id: correlationId,
 *   ...docContext
 * });
 * ```
 *
 * @example With Marker API
 * ```typescript
 * const docContext = createDocumentContext(urlHash, url);
 *
 * logger.info('Marker upload complete', {
 *   operation: 'marker_upload_success',
 *   correlation_id: correlationId,
 *   ...docContext,
 *   marker_request_id: markerResponse.request_id
 * });
 * ```
 */
export function createDocumentContext(
  urlHash: string,
  originalUrl: string
): DocumentContext {
  if (!urlHash) {
    throw new Error(
      'urlHash is required - cannot create document context without hash'
    );
  }

  if (!originalUrl) {
    throw new Error(
      'originalUrl is required - cannot create document context without URL'
    );
  }

  return {
    url_hash: urlHash,
    original_url: originalUrl,
  };
}
