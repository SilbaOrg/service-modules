# Silba Service Modules

Shared modules for Silba microservices, providing standardized functionality across all services.

## Logger Module

The logger module provides structured logging designed for Loki/Grafana integration.

### Key Features

- **Structured JSON logging** for Loki/Grafana
- **Flat metadata enforcement** - prevents nested objects that break Loki parsing
- **Five log levels**: ERROR, WARN, INFO, DEBUG, TRACE
- **Environment configuration** via LOG_LEVEL and LOG_FORMAT
- **Type-safe metadata** with compile-time and runtime validation
- **Specialized logging methods** for common patterns

### Installation

```typescript
import { createLogger } from "https://github.com/SilbaOrg/service-modules/raw/refs/tags/1.1.0/lib/logger.ts";
```

### Basic Usage

```typescript
const logger = createLogger("my-service");

// Simple logging
logger.info("Service started");
logger.error("Connection failed");

// With metadata (flat key-value pairs only!)
logger.info("User logged in", {
  user_id: "123",
  session_id: "abc-456",
  ip_address: "192.168.1.1"
});
```

### IMPORTANT: Flat Metadata Requirement

**Loki/Grafana cannot properly parse nested objects.** The logger enforces flat key-value pairs only.

#### ✅ Good - Flat Structure
```typescript
logger.info("Order processed", {
  order_id: "ORD-123",
  user_id: "USER-456",
  total_amount: 99.99,
  currency: "USD",
  items_count: 3,
  shipping_method: "express"
});

logger.error("Payment failed", {
  error_type: "PAYMENT_GATEWAY",
  error_id: "PG_TIMEOUT",
  gateway_name: "stripe",
  transaction_id: "txn_123",
  amount: 99.99
});
```

#### ❌ Bad - Nested Objects (Will Throw Error)
```typescript
// This will throw an error!
logger.error("Payment failed", {
  error: {  // Nested object - NOT ALLOWED
    type: "PAYMENT_GATEWAY",
    details: { code: "PG_001" }
  },
  user: {  // Nested object - NOT ALLOWED
    id: "123",
    email: "user@example.com"
  }
});

// Arrays are also not allowed
logger.info("Batch processed", {
  processed_ids: [1, 2, 3]  // Array - NOT ALLOWED
});
```

### Specialized Logging Methods

#### Error with Context
For structured error logging with consistent fields:

```typescript
logger.errorWithContext(
  "Failed to process payment",
  "PAYMENT_GATEWAY",      // error_type
  "PG_TIMEOUT",          // error_id
  {                      // additional context
    user_id: "123",
    amount: 99.99,
    gateway: "stripe"
  }
);
```

#### Request Tracing
For tracking requests across microservices:

```typescript
logger.infoWithTrace(
  "Processing user request",
  "trace-abc-123-def",  // trace_id for correlation
  {
    path: "/api/v1/users",
    method: "GET",
    user_id: "456"
  }
);
```

#### API Response Logging
Automatic level selection based on status code:

```typescript
logger.apiResponse(
  "/api/v1/users",     // path
  "GET",               // method
  200,                 // status
  45,                  // response time in ms
  {
    user_count: 10,
    cache_hit: true
  }
);
```

### Environment Configuration

- `LOG_LEVEL`: Set minimum log level (ERROR, WARN, INFO, DEBUG, TRACE)
- `LOG_FORMAT`: Set output format ("json" or "text")

```bash
LOG_LEVEL=DEBUG LOG_FORMAT=json deno run your-service.ts
```

### Child Loggers

Create module-specific loggers:

```typescript
const mainLogger = createLogger("my-service");
const dbLogger = mainLogger.child("database");
const apiLogger = mainLogger.child("api");

dbLogger.info("Connection established");
apiLogger.debug("Request received");
```

### Grafana/Loki Integration

The flat structure enables powerful Loki queries:

```logql
# Find all payment errors
{service="payment-service"} |= "error_type" |= "PAYMENT_GATEWAY"

# Track specific user across services
{job="silba"} |= "user_id=\"123\""

# Monitor high response times
{service="api-gateway"} |= "response_time" | json | response_time > 1000

# Correlate requests across services
{job="silba"} |= "trace_id=\"abc-123-def\""
```

### Migration Guide

If you're updating from an older version:

1. **Replace nested objects** with flat keys:
   ```typescript
   // Old (will now throw error)
   logger.error("Failed", { user: { id: "123" } });
   
   // New
   logger.error("Failed", { user_id: "123" });
   ```

2. **Flatten arrays** into separate fields:
   ```typescript
   // Old (will now throw error)
   logger.info("Processed", { items: [1, 2, 3] });
   
   // New
   logger.info("Processed", { 
     items_count: 3,
     items_first: 1,
     items_last: 3
   });
   ```

3. **Use specialized methods** for common patterns:
   ```typescript
   // Instead of manual error structure
   logger.errorWithContext("DB failed", "DATABASE", "CONNECTION_TIMEOUT", {
     host: "db.example.com"
   });
   ```

### Best Practices

1. **Consistent field names** across services:
   - `user_id`, `order_id`, `trace_id` (not userId, UserID, etc.)
   - `error_type`, `error_id` for errors
   - `response_time` in milliseconds

2. **Keep values simple**:
   - Strings, numbers, booleans only
   - No objects, arrays, or complex types

3. **Use descriptive keys**:
   - `payment_gateway_name` instead of just `gateway`
   - `database_connection_pool_size` instead of `pool_size`

4. **Include context** for debugging:
   - Always include relevant IDs (user, order, transaction)
   - Add operation context (endpoint, method, service)

## Version History

- **1.1.0** - Added flat metadata enforcement and improved Loki/Grafana integration
- **1.0.9** - Previous stable version

## License

Proprietary - Silba