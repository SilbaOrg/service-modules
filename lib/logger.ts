/**
 * Logging system implementation for Silba microservices
 * 
 * This module provides standardized logging that integrates with Loki/Grafana.
 * 
 * Environment variables:
 * - LOG_LEVEL: Sets minimum log level (ERROR, WARN, INFO, DEBUG, TRACE)
 * - LOG_FORMAT: Sets output format ("json" or "text")
 * 
 * IMPORTANT: For Loki/Grafana integration:
 * - Always use flat key-value pairs in metadata (avoid nested objects)
 * - Use consistent field names across services (error_type, error_id, trace_id, etc.)
 * - Keep metadata values as strings or numbers for best compatibility
 * 
 * @example Good logging practice:
 * ```typescript
 * logger.error("Payment failed", {
 *   error_type: "PAYMENT_GATEWAY",
 *   error_id: "PG_001",
 *   user_id: "123",
 *   amount: 99.99,
 *   gateway: "stripe"
 * });
 * ```
 * 
 * @example Bad logging practice (avoid nested objects):
 * ```typescript
 * // DON'T DO THIS - Loki cannot parse nested objects well
 * logger.error("Payment failed", {
 *   error: {
 *     type: "PAYMENT_GATEWAY",
 *     details: { code: "PG_001" }
 *   }
 * });
 * ```
 */

import { type LogEntry, type LoggerConfig, type FlatLogMetadata, LogLevel, validateFlatMetadata } from "./types.ts";

function createLogger(
  serviceName: string,
  options: Partial<LoggerConfig> = {}
) {
  // Get environment variables first
  const envLogLevel = parseLogLevel(Deno.env.get("LOG_LEVEL"));
  const envLogFormat = Deno.env.get("LOG_FORMAT") as
    | "json"
    | "text"
    | undefined;

  const config: LoggerConfig = {
    serviceName,
    module: options.module,
    // Apply options first
    ...options,
    // Then override with environment variables if they exist
    minLevel:
      envLogLevel !== undefined
        ? envLogLevel
        : options.minLevel || LogLevel.INFO,
    format: envLogFormat || options.format || ("json" as "json" | "text"),
  };

  function log(
    level: LogLevel,
    message: string,
    metadata: Record<string, unknown> = {}
  ): void {
    if (level > config.minLevel) {
      return;
    }

    // Validate metadata to ensure flat structure
    validateFlatMetadata(metadata);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      service: config.serviceName,
      ...metadata,
    };

    if (config.module) {
      entry.module = config.module;
    }

    outputLog(entry, config.format);
  }

  // Create a logger instance
  const logger = {
    error: (message: string, metadata?: FlatLogMetadata) =>
      log(LogLevel.ERROR, message, metadata),
    warn: (message: string, metadata?: FlatLogMetadata) =>
      log(LogLevel.WARN, message, metadata),
    info: (message: string, metadata?: FlatLogMetadata) =>
      log(LogLevel.INFO, message, metadata),
    debug: (message: string, metadata?: FlatLogMetadata) =>
      log(LogLevel.DEBUG, message, metadata),
    trace: (message: string, metadata?: FlatLogMetadata) =>
      log(LogLevel.TRACE, message, metadata),
      
    /**
     * Log an error with structured context for better Loki/Grafana filtering
     * @param message - Human-readable error message
     * @param errorType - Category of error (e.g., "VALIDATION", "DATABASE", "API_EXTERNAL")
     * @param errorId - Unique identifier for this error type (e.g., "DB_CONNECTION_FAILED")
     * @param context - Additional flat key-value pairs (avoid nested objects)
     * 
     * @example
     * logger.errorWithContext(
     *   "Failed to process payment",
     *   "PAYMENT_GATEWAY",
     *   "PG_TIMEOUT",
     *   { user_id: "123", amount: 99.99, gateway: "stripe" }
     * );
     */
    errorWithContext: (
      message: string,
      errorType: string,
      errorId: string,
      context: Record<string, string | number | boolean> = {}
    ) => {
      log(LogLevel.ERROR, message, {
        error_type: errorType,
        error_id: errorId,
        ...context,
      });
    },
    
    /**
     * Log a request with trace ID for correlation across services
     * @param message - Log message
     * @param traceId - Unique trace ID for the request
     * @param metadata - Additional flat key-value pairs
     * 
     * @example
     * logger.infoWithTrace("Processing user request", "abc-123-def", {
     *   path: "/api/v1/users",
     *   method: "GET"
     * });
     */
    infoWithTrace: (
      message: string,
      traceId: string,
      metadata: FlatLogMetadata = {}
    ) => {
      log(LogLevel.INFO, message, {
        trace_id: traceId,
        ...metadata,
      });
    },
    
    /**
     * Log API response details for monitoring
     * @param path - API endpoint path
     * @param method - HTTP method
     * @param status - HTTP status code
     * @param responseTime - Response time in milliseconds
     * @param metadata - Additional context
     * 
     * @example
     * logger.apiResponse("/api/v1/users", "GET", 200, 45, { user_count: 10 });
     */
    apiResponse: (
      path: string,
      method: string,
      status: number,
      responseTime: number,
      metadata: FlatLogMetadata = {}
    ) => {
      const level = status >= 500 ? LogLevel.ERROR : 
                   status >= 400 ? LogLevel.WARN : 
                   LogLevel.INFO;
      
      log(level, `${method} ${path} ${status}`, {
        path,
        method,
        status,
        response_time: responseTime,
        ...metadata,
      });
    },
    
    // Create a child logger with the same service name but different module
    child: (module: string) =>
      createLogger(config.serviceName, { ...options, module }),
  };

  return logger;
}

function parseLogLevel(level?: string): LogLevel | undefined {
  if (!level) return undefined;

  const upperLevel = level.toUpperCase();
  if (upperLevel in LogLevel) {
    return LogLevel[upperLevel as keyof typeof LogLevel];
  }

  return undefined;
}

function outputLog(entry: LogEntry, format: "json" | "text"): void {
  if (format === "json") {
    console.log(JSON.stringify(entry));
  } else {
    const level = entry.level.padEnd(5);
    const module = entry.module ? `[${entry.module}]` : "";
    const requestId = entry.requestId ? `(${entry.requestId})` : "";

    // Extract common fields
    const {
      timestamp,
      level: _,
      service,
      module: __,
      message,
      requestId: ___,
      ...rest
    } = entry;

    let metadata = "";
    if (Object.keys(rest).length > 0) {
      metadata = ` ${JSON.stringify(rest)}`;
    }

    console.log(
      `${timestamp} ${level} ${service}${module} ${requestId}: ${message}${metadata}`
    );
  }
}

export { createLogger };
