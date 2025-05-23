// Generic response type
interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

// Logging types
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LoggerConfig {
  serviceName: string;
  module?: string;
  minLevel: LogLevel;
  format: "json" | "text";
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  module?: string;
  requestId?: string;
  [key: string]: unknown;
}

export type { LoggerConfig, LogEntry, ServiceResponse };

export { LogLevel };
