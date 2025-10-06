/**
 * Standardized HTTP logging middleware for Oak router.
 *
 * Provides consistent request/response logging across all Silba services
 * with automatic health check detection and structured metadata.
 *
 * @example
 * ```typescript
 * import { createHttpLoggingMiddleware } from "@service-modules/lib/http-logging-middleware.ts";
 *
 * const app = new Application();
 * app.use(createHttpLoggingMiddleware("company-documents"));
 * ```
 */

import type { Context, Next } from "jsr:@oak/oak@^17.1.6";
import { createLogger } from "./logger.ts";

export interface HttpLoggingOptions {
  /**
   * Whether to log health check requests at DEBUG level instead of INFO
   * @default true
   */
  quietHealthChecks?: boolean;

  /**
   * Custom function to determine if a request is a health check
   * @default (path) => path === '/health'
   */
  isHealthCheck?: (path: string) => boolean;

  /**
   * Module name for the logger
   * @default "http:middleware"
   */
  module?: string;
}

/**
 * Create HTTP logging middleware for Oak
 *
 * @param serviceName - Name of the service
 * @param options - Configuration options
 * @returns Oak middleware function
 *
 * @example Basic usage:
 * ```typescript
 * app.use(createHttpLoggingMiddleware("company-documents"));
 * ```
 *
 * @example Custom health check detection:
 * ```typescript
 * app.use(createHttpLoggingMiddleware("company-documents", {
 *   isHealthCheck: (path) => path === '/health' || path === '/ready'
 * }));
 * ```
 */
export function createHttpLoggingMiddleware(
  serviceName: string,
  options: HttpLoggingOptions = {}
) {
  const {
    quietHealthChecks = true,
    isHealthCheck = (path: string) => path === "/health",
    module = "http:middleware",
  } = options;

  const logger = createLogger(serviceName, { module });

  return async (ctx: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const method = ctx.request.method;
    const path = ctx.request.url.pathname;

    // Set request ID header
    ctx.response.headers.set("X-Request-ID", requestId);

    const isHealthCheckRequest = isHealthCheck(path);

    // Base metadata for all logs
    const baseMetadata = {
      request_id: requestId,
      http_method: method,
      http_path: path,
      isHealthCheck: isHealthCheckRequest,
    };

    // Log request start
    if (isHealthCheckRequest && quietHealthChecks) {
      logger.debug("HTTP request received", baseMetadata);
    } else {
      logger.info("HTTP request received", baseMetadata);
    }

    try {
      // Process request
      await next();

      // Calculate duration
      const durationMs = Date.now() - startTime;
      const status = ctx.response.status || 200;

      // Determine log level based on status code
      const responseMetadata = {
        ...baseMetadata,
        http_status: status,
        duration_ms: durationMs,
      };

      if (status >= 500) {
        logger.error("HTTP request completed", responseMetadata);
      } else if (status >= 400) {
        logger.warn("HTTP request completed", responseMetadata);
      } else if (isHealthCheckRequest && quietHealthChecks) {
        logger.debug("HTTP request completed", responseMetadata);
      } else {
        logger.info("HTTP request completed", responseMetadata);
      }
    } catch (error: unknown) {
      // Calculate duration for failed requests
      const durationMs = Date.now() - startTime;
      const status = ctx.response.status || 500;

      logger.error("HTTP request failed", {
        ...baseMetadata,
        http_status: status,
        duration_ms: durationMs,
        error_message: error instanceof Error ? error.message : String(error),
        error_name: error instanceof Error ? error.name : "UnknownError",
        error_stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw to let Oak handle the error
      throw error;
    }
  };
}

/**
 * Create a simple request ID middleware that only adds X-Request-ID header
 * without logging. Useful if you want to add request IDs but handle logging separately.
 *
 * @returns Oak middleware function
 *
 * @example
 * ```typescript
 * app.use(createRequestIdMiddleware());
 * ```
 */
export function createRequestIdMiddleware() {
  return async (ctx: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    ctx.response.headers.set("X-Request-ID", requestId);
    ctx.state.requestId = requestId;
    await next();
  };
}
