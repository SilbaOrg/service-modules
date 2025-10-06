/**
 * Standardized logging helpers for common patterns across Silba microservices.
 *
 * These helpers ensure consistent log structure and filtering in Seq/Loki/Grafana.
 * All helpers automatically add metadata fields that make filtering easier.
 *
 * @example Filter out health checks in Seq:
 * ```
 * isHealthCheck != true
 * ```
 *
 * @example Filter HTTP requests by status:
 * ```
 * http_status >= 500
 * ```
 */

import { createLogger } from "./logger.ts";
import type { FlatLogMetadata } from "./types.ts";

/**
 * Create a logger that automatically tags all logs as health check logs.
 * This makes it easy to filter out health check noise in Seq.
 *
 * @param serviceName - Name of the service
 * @param module - Optional module name (defaults to "route:health")
 * @returns Logger instance that adds isHealthCheck: true to all logs
 *
 * @example
 * ```typescript
 * const logger = createHealthCheckLogger("company-documents");
 * logger.debug("Health check completed", { status: "healthy" });
 * // Logs: { ..., isHealthCheck: true, status: "healthy" }
 * ```
 */
export function createHealthCheckLogger(serviceName: string, module = "route:health") {
  const baseLogger = createLogger(serviceName, { module });

  return {
    error: (message: string, metadata?: FlatLogMetadata) =>
      baseLogger.error(message, { ...metadata, isHealthCheck: true }),
    warn: (message: string, metadata?: FlatLogMetadata) =>
      baseLogger.warn(message, { ...metadata, isHealthCheck: true }),
    info: (message: string, metadata?: FlatLogMetadata) =>
      baseLogger.info(message, { ...metadata, isHealthCheck: true }),
    debug: (message: string, metadata?: FlatLogMetadata) =>
      baseLogger.debug(message, { ...metadata, isHealthCheck: true }),
    trace: (message: string, metadata?: FlatLogMetadata) =>
      baseLogger.trace(message, { ...metadata, isHealthCheck: true }),
  };
}

/**
 * HTTP request context for structured logging
 */
export interface HttpRequestContext {
  method: string;
  path: string;
  requestId?: string;
  userId?: string;
  ip?: string;
}

/**
 * HTTP response context for structured logging
 */
export interface HttpResponseContext {
  status: number;
  durationMs: number;
  bytesOut?: number;
  error?: string;
}

/**
 * Create a logger specialized for HTTP request/response logging.
 * Adds consistent HTTP-related metadata fields.
 *
 * @param serviceName - Name of the service
 * @param module - Optional module name (defaults to "http")
 * @returns Logger with HTTP-specific methods
 *
 * @example
 * ```typescript
 * const logger = createHttpLogger("company-documents");
 *
 * logger.request({
 *   method: "GET",
 *   path: "/api/v1/documents",
 *   requestId: "abc-123"
 * });
 *
 * logger.response({
 *   method: "GET",
 *   path: "/api/v1/documents",
 *   requestId: "abc-123"
 * }, {
 *   status: 200,
 *   durationMs: 45
 * });
 * ```
 */
export function createHttpLogger(serviceName: string, module = "http") {
  const baseLogger = createLogger(serviceName, { module });

  return {
    /**
     * Log incoming HTTP request
     */
    request: (ctx: HttpRequestContext, metadata?: FlatLogMetadata) => {
      baseLogger.info("HTTP request received", {
        http_method: ctx.method,
        http_path: ctx.path,
        request_id: ctx.requestId,
        user_id: ctx.userId,
        client_ip: ctx.ip,
        ...metadata,
      });
    },

    /**
     * Log HTTP response with automatic log level based on status code
     */
    response: (
      ctx: HttpRequestContext,
      response: HttpResponseContext,
      metadata?: FlatLogMetadata
    ) => {
      const logData = {
        http_method: ctx.method,
        http_path: ctx.path,
        http_status: response.status,
        duration_ms: response.durationMs,
        request_id: ctx.requestId,
        user_id: ctx.userId,
        bytes_out: response.bytesOut,
        error: response.error,
        ...metadata,
      };

      const message = "HTTP request completed";

      // Log at appropriate level based on status code
      if (response.status >= 500) {
        baseLogger.error(message, logData);
      } else if (response.status >= 400) {
        baseLogger.warn(message, logData);
      } else {
        baseLogger.info(message, logData);
      }
    },

    /**
     * Log HTTP error
     */
    error: (
      ctx: HttpRequestContext,
      error: Error,
      statusCode: number,
      metadata?: FlatLogMetadata
    ) => {
      baseLogger.error("HTTP request failed", {
        http_method: ctx.method,
        http_path: ctx.path,
        http_status: statusCode,
        request_id: ctx.requestId,
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        ...metadata,
      });
    },

    /**
     * Get the underlying base logger for custom logging
     */
    base: baseLogger,
  };
}

/**
 * Create a logger for database operations with consistent metadata.
 *
 * @param serviceName - Name of the service
 * @param module - Optional module name (defaults to "database")
 * @returns Logger with database-specific methods
 *
 * @example
 * ```typescript
 * const logger = createDatabaseLogger("company-documents");
 *
 * logger.query("SELECT * FROM companies", {
 *   table: "companies",
 *   durationMs: 12,
 *   rowCount: 150
 * });
 * ```
 */
export function createDatabaseLogger(serviceName: string, module = "database") {
  const baseLogger = createLogger(serviceName, { module });

  return {
    /**
     * Log database query
     */
    query: (
      operation: string,
      metadata: FlatLogMetadata & {
        table?: string;
        durationMs?: number;
        rowCount?: number;
      }
    ) => {
      baseLogger.debug(operation, {
        db_operation: "query",
        db_table: metadata.table,
        duration_ms: metadata.durationMs,
        row_count: metadata.rowCount,
        ...metadata,
      });
    },

    /**
     * Log database error
     */
    error: (operation: string, error: Error, metadata?: FlatLogMetadata) => {
      baseLogger.error(operation, {
        db_operation: "error",
        error_message: error.message,
        error_name: error.name,
        ...metadata,
      });
    },

    /**
     * Get the underlying base logger
     */
    base: baseLogger,
  };
}

/**
 * Create a logger for external API calls with consistent metadata.
 *
 * @param serviceName - Name of the service
 * @param module - Module name (e.g., "api:supabase", "api:openai")
 * @returns Logger with API-specific methods
 *
 * @example
 * ```typescript
 * const logger = createApiLogger("company-documents", "api:openai");
 *
 * logger.call("POST /v1/chat/completions", {
 *   provider: "openai",
 *   model: "gpt-4",
 *   durationMs: 1500,
 *   status: 200
 * });
 * ```
 */
export function createApiLogger(serviceName: string, module: string) {
  const baseLogger = createLogger(serviceName, { module });

  return {
    /**
     * Log external API call
     */
    call: (
      endpoint: string,
      metadata: FlatLogMetadata & {
        provider?: string;
        durationMs?: number;
        status?: number;
        cached?: boolean;
      }
    ) => {
      const level = metadata.status && metadata.status >= 400 ? "warn" : "info";

      if (level === "warn") {
        baseLogger.warn(`API call: ${endpoint}`, {
          api_endpoint: endpoint,
          api_provider: metadata.provider,
          duration_ms: metadata.durationMs,
          http_status: metadata.status,
          cache_hit: metadata.cached,
          ...metadata,
        });
      } else {
        baseLogger.info(`API call: ${endpoint}`, {
          api_endpoint: endpoint,
          api_provider: metadata.provider,
          duration_ms: metadata.durationMs,
          http_status: metadata.status,
          cache_hit: metadata.cached,
          ...metadata,
        });
      }
    },

    /**
     * Log API error
     */
    error: (
      endpoint: string,
      error: Error,
      metadata?: FlatLogMetadata
    ) => {
      baseLogger.error(`API call failed: ${endpoint}`, {
        api_endpoint: endpoint,
        error_message: error.message,
        error_name: error.name,
        ...metadata,
      });
    },

    /**
     * Get the underlying base logger
     */
    base: baseLogger,
  };
}
