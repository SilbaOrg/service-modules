import { createLogger } from "./logger.ts";
import type { FlatLogMetadata } from "./types.ts";

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

export interface HttpRequestContext {
  method: string;
  path: string;
  requestId?: string;
  userId?: string;
  ip?: string;
}

export interface HttpResponseContext {
  status: number;
  durationMs: number;
  bytesOut?: number;
  error?: string;
}

export function createHttpLogger(serviceName: string, module = "http") {
  const baseLogger = createLogger(serviceName, { module });

  return {
    request: (requestContext: HttpRequestContext, metadata?: FlatLogMetadata) => {
      baseLogger.info("HTTP request received", {
        http_method: requestContext.method,
        http_path: requestContext.path,
        request_id: requestContext.requestId,
        user_id: requestContext.userId,
        client_ip: requestContext.ip,
        ...metadata,
      });
    },

    response: (
      requestContext: HttpRequestContext,
      responseContext: HttpResponseContext,
      metadata?: FlatLogMetadata
    ) => {
      const logData = {
        http_method: requestContext.method,
        http_path: requestContext.path,
        http_status: responseContext.status,
        duration_ms: responseContext.durationMs,
        request_id: requestContext.requestId,
        user_id: requestContext.userId,
        bytes_out: responseContext.bytesOut,
        error: responseContext.error,
        ...metadata,
      };

      const logMessage = "HTTP request completed";

      if (responseContext.status >= 500) {
        baseLogger.error(logMessage, logData);
      } else if (responseContext.status >= 400) {
        baseLogger.warn(logMessage, logData);
      } else {
        baseLogger.info(logMessage, logData);
      }
    },

    error: (
      requestContext: HttpRequestContext,
      error: Error,
      statusCode: number,
      metadata?: FlatLogMetadata
    ) => {
      baseLogger.error("HTTP request failed", {
        http_method: requestContext.method,
        http_path: requestContext.path,
        http_status: statusCode,
        request_id: requestContext.requestId,
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        ...metadata,
      });
    },

    base: baseLogger,
  };
}

export function createDatabaseLogger(serviceName: string, module = "database") {
  const baseLogger = createLogger(serviceName, { module });

  return {
    query: (
      message: string,
      metadata: FlatLogMetadata & {
        table?: string;
        durationMs?: number;
        rowCount?: number;
      }
    ) => {
      baseLogger.debug(message, {
        db_operation: "query",
        db_table: metadata.table,
        duration_ms: metadata.durationMs,
        row_count: metadata.rowCount,
        ...metadata,
      });
    },

    error: (message: string, error: Error, metadata?: FlatLogMetadata) => {
      baseLogger.error(message, {
        db_operation: "error",
        error_message: error.message,
        error_name: error.name,
        ...metadata,
      });
    },

    base: baseLogger,
  };
}

export function createApiLogger(serviceName: string, module: string) {
  const baseLogger = createLogger(serviceName, { module });

  return {
    call: (
      methodAndPath: string,
      metadata: FlatLogMetadata & {
        provider?: string;
        durationMs?: number;
        status?: number;
        cached?: boolean;
      }
    ) => {
      const logData = {
        api_endpoint: methodAndPath,
        api_provider: metadata.provider,
        duration_ms: metadata.durationMs,
        http_status: metadata.status,
        cache_hit: metadata.cached,
        ...metadata,
      };

      if (metadata.status && metadata.status >= 400) {
        baseLogger.warn(`API call: ${methodAndPath}`, logData);
      } else {
        baseLogger.info(`API call: ${methodAndPath}`, logData);
      }
    },

    error: (
      methodAndPath: string,
      error: Error,
      metadata?: FlatLogMetadata
    ) => {
      baseLogger.error(`API call failed: ${methodAndPath}`, {
        api_endpoint: methodAndPath,
        error_message: error.message,
        error_name: error.name,
        ...metadata,
      });
    },

    base: baseLogger,
  };
}
