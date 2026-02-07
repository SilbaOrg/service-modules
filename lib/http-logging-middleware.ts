import type { Context, Next } from "jsr:@oak/oak@^17.1.6";
import { createLogger } from "./logger.ts";

export interface HttpLoggingOptions {
  quietHealthChecks?: boolean;
  isHealthCheck?: (path: string) => boolean;
  module?: string;
}

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

    ctx.response.headers.set("X-Request-ID", requestId);

    const isHealthCheckRequest = isHealthCheck(path);

    const baseMetadata = {
      request_id: requestId,
      http_method: method,
      http_path: path,
      isHealthCheck: isHealthCheckRequest,
    };

    if (isHealthCheckRequest && quietHealthChecks) {
      logger.debug("HTTP request received", baseMetadata);
    } else {
      logger.info("HTTP request received", baseMetadata);
    }

    try {
      await next();

      const durationMs = Date.now() - startTime;
      const status = ctx.response.status || 200;

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

      throw error;
    }
  };
}

export function createRequestIdMiddleware() {
  return async (ctx: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    ctx.response.headers.set("X-Request-ID", requestId);
    ctx.state.requestId = requestId;
    await next();
  };
}
