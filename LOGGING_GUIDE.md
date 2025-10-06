# Logging Helpers Guide

## Overview

Service-modules provides standardized logging helpers to ensure consistent log structure and easy filtering in Seq/Loki/Grafana. These helpers automatically add metadata fields that make filtering and analysis easier.

## Key Benefits

1. **Consistent metadata** across all services
2. **Easy filtering** in Seq (e.g., `isHealthCheck != true`)
3. **Single source of truth** for common logging patterns
4. **Type-safe** logging with TypeScript

## Available Helpers

### 1. Health Check Logger

Automatically tags all logs as health checks with `isHealthCheck: true`, making it trivial to filter them out in Seq.

```typescript
import { createHealthCheckLogger } from "@service-modules/lib/logging-helpers.ts";

const logger = createHealthCheckLogger("company-documents");

// All logs will have isHealthCheck: true
logger.debug("Health check request received");
logger.debug("Health check completed", {
  status: "healthy",
  uptime_seconds: 123
});
```

**Seq Filter to exclude health checks:**
```
isHealthCheck != true
```

### 2. HTTP Logger

Specialized logger for HTTP requests/responses with automatic log level selection based on status codes.

```typescript
import { createHttpLogger } from "@service-modules/lib/logging-helpers.ts";

const logger = createHttpLogger("company-documents");

// Log incoming request
logger.request({
  method: "GET",
  path: "/api/v1/documents",
  requestId: "abc-123",
  userId: "user-456"
});

// Log response (automatically uses ERROR level for 5xx, WARN for 4xx, INFO for 2xx/3xx)
logger.response(
  {
    method: "GET",
    path: "/api/v1/documents",
    requestId: "abc-123"
  },
  {
    status: 200,
    durationMs: 45,
    bytesOut: 1024
  }
);

// Log HTTP error
logger.error(
  { method: "POST", path: "/api/v1/documents", requestId: "xyz-789" },
  new Error("Database connection failed"),
  500
);
```

**Seq Filters:**
```
// Find slow requests
duration_ms > 1000

// Find errors
http_status >= 500

// Find requests to specific endpoint
http_path like '%documents%'
```

### 3. HTTP Logging Middleware

Drop-in Oak middleware that replaces custom logging middleware in each service.

```typescript
import { Application } from "@oak/oak";
import { createHttpLoggingMiddleware } from "@service-modules/lib/http-logging-middleware.ts";

const app = new Application();

// Basic usage - logs all requests, quiets health checks at DEBUG level
app.use(createHttpLoggingMiddleware("company-documents"));

// Custom configuration
app.use(createHttpLoggingMiddleware("company-documents", {
  quietHealthChecks: true,  // Health checks logged at DEBUG instead of INFO
  isHealthCheck: (path) => path === '/health' || path === '/ready',
  module: "http:access"
}));

app.use(router.routes());
await app.listen({ port: 5051 });
```

**Benefits:**
- Automatic request ID generation
- Automatic response time tracking
- Automatic log level selection (ERROR for 5xx, WARN for 4xx, INFO for 2xx/3xx)
- Consistent metadata fields across all services
- Health check noise reduction

### 4. Database Logger

Consistent logging for database operations.

```typescript
import { createDatabaseLogger } from "@service-modules/lib/logging-helpers.ts";

const logger = createDatabaseLogger("company-documents");

// Log query
logger.query("Companies fetched successfully", {
  table: "companies",
  durationMs: 12,
  rowCount: 150
});

// Log error
logger.error("Failed to insert company", error, {
  table: "companies",
  operation: "INSERT"
});
```

**Seq Filters:**
```
// Find slow queries
db_operation = "query" AND duration_ms > 100

// Find database errors
db_operation = "error"
```

### 5. API Logger

Logging for external API calls (Supabase, OpenAI, etc.).

```typescript
import { createApiLogger } from "@service-modules/lib/logging-helpers.ts";

const logger = createApiLogger("company-documents", "api:openai");

// Log API call
logger.call("POST /v1/chat/completions", {
  provider: "openai",
  model: "gpt-4",
  durationMs: 1500,
  status: 200,
  cached: false
});

// Log API error
logger.error(
  "POST /v1/chat/completions",
  new Error("Rate limit exceeded"),
  { provider: "openai", model: "gpt-4" }
);
```

**Seq Filters:**
```
// Find API errors
api_provider = "openai" AND http_status >= 400

// Find slow API calls
api_provider = "openai" AND duration_ms > 2000

// Check cache hit rate
api_provider = "supabase" AND cache_hit = true
```

## Migration Guide

### Migrating Health Check Routes

**Before:**
```typescript
import { createLogger } from "@service-modules/lib/logger.ts";

const logger = createLogger("company-documents", { module: "route:health" });

router.get("/health", (ctx) => {
  logger.debug("Health check request received");
  logger.debug("Health check completed", { status: "healthy" });
});
```

**After:**
```typescript
import { createHealthCheckLogger } from "@service-modules/lib/logging-helpers.ts";

const logger = createHealthCheckLogger("company-documents");

router.get("/health", (ctx) => {
  logger.debug("Health check request received");
  logger.debug("Health check completed", { status: "healthy" });
});
```

### Migrating HTTP Logging Middleware

**Before:**
```typescript
// lib/middlewares/logging.ts
import type { Context, Next } from "@oak/oak";
import { createLogger } from "@service-modules/lib/logger.ts";

const logger = createLogger("document-markdown", {
  module: "middleware:logging",
});

export function loggingMiddleware() {
  return async (ctx: Context, next: Next) => {
    const requestId = crypto.randomUUID();
    const start = Date.now();
    ctx.response.headers.set("X-Request-ID", requestId);

    const isHealthCheck = ctx.request.url.pathname === '/health';

    if (isHealthCheck) {
      logger.debug(
        `Request started: ${ctx.request.method} ${ctx.request.url.pathname}`,
        {
          requestId,
          method: ctx.request.method,
          path: ctx.request.url.pathname,
        }
      );
    } else {
      logger.info(
        `Request started: ${ctx.request.method} ${ctx.request.url.pathname}`,
        {
          requestId,
          method: ctx.request.method,
          path: ctx.request.url.pathname,
        }
      );
    }

    try {
      await next();
      const ms = Date.now() - start;
      // ... more logging
    } catch (error: unknown) {
      // ... error handling
    }
  };
}
```

**After:**
```typescript
// Delete lib/middlewares/logging.ts entirely

// In lib/server.ts
import { createHttpLoggingMiddleware } from "@service-modules/lib/http-logging-middleware.ts";

const app = new Application();
app.use(createHttpLoggingMiddleware("document-markdown"));
```

## Common Seq Queries

### Filter Out Health Checks
```
isHealthCheck != true
```

### Find All Errors
```
@Level = "ERROR"
```

### Find Slow HTTP Requests
```
http_method exists AND duration_ms > 1000
```

### Find API Errors from Specific Provider
```
api_provider = "openai" AND @Level = "ERROR"
```

### Find Database Queries to Specific Table
```
db_table = "companies" AND db_operation = "query"
```

### Trace a Specific Request
```
request_id = "abc-123-def-456"
```

## Best Practices

1. **Always use helpers for common patterns** - Don't create custom loggers for health checks, HTTP, DB, or API operations
2. **Use flat metadata** - Avoid nested objects, use `user_id` not `user: { id: ... }`
3. **Include request IDs** - Makes tracing requests across services easy
4. **Log errors with context** - Always include relevant IDs, operations, etc.
5. **Use appropriate log levels**:
   - `ERROR`: Failures that need investigation
   - `WARN`: Degraded performance, retries, 4xx responses
   - `INFO`: Normal operations, 2xx/3xx responses
   - `DEBUG`: Detailed info for debugging, health checks
   - `TRACE`: Very verbose, rarely used

## Environment Variables

All loggers respect these environment variables:

- `LOG_LEVEL`: Set minimum log level (ERROR, WARN, INFO, DEBUG, TRACE)
- `LOG_FORMAT`: Set output format ("json" or "text")

```bash
# In production
LOG_LEVEL=INFO
LOG_FORMAT=json

# In development
LOG_LEVEL=DEBUG
LOG_FORMAT=text
```
