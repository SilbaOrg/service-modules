// Logging system implementation
// This file provides standardized logging across all Silba microservices
// Environment variables:
// - LOG_LEVEL: Sets minimum log level (ERROR, WARN, INFO, DEBUG, TRACE)
// - LOG_FORMAT: Sets output format ("json" or "text")

import { type LogEntry, type LoggerConfig, LogLevel } from "./types.ts";

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
    if (level < config.minLevel) {
      return;
    }

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
    error: (message: string, metadata?: Record<string, unknown>) =>
      log(LogLevel.ERROR, message, metadata),
    warn: (message: string, metadata?: Record<string, unknown>) =>
      log(LogLevel.WARN, message, metadata),
    info: (message: string, metadata?: Record<string, unknown>) =>
      log(LogLevel.INFO, message, metadata),
    debug: (message: string, metadata?: Record<string, unknown>) =>
      log(LogLevel.DEBUG, message, metadata),
    trace: (message: string, metadata?: Record<string, unknown>) =>
      log(LogLevel.TRACE, message, metadata),
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
