import { createLogger } from "./logger.ts";
import type { ServiceResponse, HealthStatus, EnhancedHealthResponse } from "./types.ts";

/**
 * Response time measurement for percentile calculations
 */
interface ResponseTimeEntry {
  timestamp: number;
  responseTime: number;
  success: boolean;
}

/**
 * Health tracking middleware for Deno services
 * Tracks uptime, response times, and success rates in memory
 */
export class HealthMiddleware {
  private serviceName: string;
  private startTime: number;
  private logger: ReturnType<typeof createLogger>;
  private responseTimes: ResponseTimeEntry[] = [];
  private totalRequests = 0;
  private successfulRequests = 0;
  private readonly maxResponseTimeEntries = 1000; // Keep last 1000 entries for percentiles
  private readonly responseTimeWindowMs = 5 * 60 * 1000; // 5 minutes

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.startTime = Date.now();
    this.logger = createLogger(serviceName, { module: "health-middleware" });
    
    this.logger.info("Health middleware initialized", {
      service: serviceName,
      start_time: new Date(this.startTime).toISOString(),
    });
  }

  /**
   * Record a request and its outcome for metrics calculation
   */
  recordRequest(responseTimeMs: number, success: boolean): void {
    const now = Date.now();
    
    this.totalRequests++;
    if (success) {
      this.successfulRequests++;
    }

    // Add to response times array
    this.responseTimes.push({
      timestamp: now,
      responseTime: responseTimeMs,
      success,
    });

    // Keep only recent entries and limit array size
    this.cleanupResponseTimes(now);

    this.logger.trace("Request recorded", {
      response_time_ms: responseTimeMs,
      success,
      total_requests: this.totalRequests,
      successful_requests: this.successfulRequests,
    });
  }

  /**
   * Get current health status with comprehensive metrics
   */
  getHealthStatus(serviceSpecific?: Record<string, string | number | boolean>): ServiceResponse<EnhancedHealthResponse> {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - this.startTime) / 1000);
    const uptimePercentage = 100; // Service is running, so it's 100% uptime since start
    
    // Calculate response time metrics
    const recentResponseTimes = this.getRecentResponseTimes(now);
    const avgResponseTime = this.calculateAverageResponseTime(recentResponseTimes);
    const p95ResponseTime = this.calculatePercentile(recentResponseTimes, 95);
    
    // Calculate success rate
    const successRate = this.totalRequests > 0 
      ? (this.successfulRequests / this.totalRequests) * 100 
      : 100;

    // Determine health status based on success rate and response times
    const status = this.determineHealthStatus(successRate, avgResponseTime);

    const healthData: EnhancedHealthResponse = {
      status,
      uptime_percentage: uptimePercentage,
      uptime_seconds: uptimeSeconds,
      response_time_avg_ms: Math.round(avgResponseTime * 100) / 100, // Round to 2 decimal places
      response_time_p95_ms: Math.round(p95ResponseTime * 100) / 100,
      requests_total: this.totalRequests,
      requests_successful: this.successfulRequests,
      success_rate_percentage: Math.round(successRate * 100) / 100,
      last_restart: new Date(this.startTime).toISOString(),
      service_specific: serviceSpecific,
    };

    this.logger.debug("Health status requested", {
      status,
      uptime_seconds: uptimeSeconds,
      success_rate: successRate,
      avg_response_time: avgResponseTime,
      total_requests: this.totalRequests,
    });

    return {
      success: true,
      data: healthData,
    };
  }

  /**
   * Create a middleware function that can be used with Oak router
   */
  createHealthEndpoint(): (ctx: any) => Promise<void> {
    return async (ctx: any) => {
      const startTime = Date.now();
      
      try {
        // Record this health check request
        const responseTime = Date.now() - startTime;
        this.recordRequest(responseTime, true);
        
        const healthResponse = this.getHealthStatus();
        ctx.response.body = healthResponse;
        
        this.logger.debug("Health check endpoint accessed", {
          response_time_ms: responseTime,
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordRequest(responseTime, false);
        
        this.logger.error("Health check endpoint failed", {
          error_message: error instanceof Error ? error.message : String(error),
          response_time_ms: responseTime,
        });
        
        ctx.response.status = 503;
        ctx.response.body = {
          success: false,
          error: {
            code: "HEALTH_CHECK_FAILED",
            message: "Health check failed",
          },
        };
      }
    };
  }

  /**
   * Remove old response time entries to keep memory usage bounded
   */
  private cleanupResponseTimes(currentTime: number): void {
    // Remove entries older than the time window
    const cutoffTime = currentTime - this.responseTimeWindowMs;
    this.responseTimes = this.responseTimes.filter(entry => entry.timestamp > cutoffTime);
    
    // If still too many entries, keep only the most recent ones
    if (this.responseTimes.length > this.maxResponseTimeEntries) {
      this.responseTimes = this.responseTimes.slice(-this.maxResponseTimeEntries);
    }
  }

  /**
   * Get recent response times within the time window
   */
  private getRecentResponseTimes(currentTime: number): number[] {
    const cutoffTime = currentTime - this.responseTimeWindowMs;
    return this.responseTimes
      .filter(entry => entry.timestamp > cutoffTime)
      .map(entry => entry.responseTime);
  }

  /**
   * Calculate average response time from an array of response times
   */
  private calculateAverageResponseTime(responseTimes: number[]): number {
    if (responseTimes.length === 0) return 0;
    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / responseTimes.length;
  }

  /**
   * Calculate percentile from response times array
   */
  private calculatePercentile(responseTimes: number[], percentile: number): number {
    if (responseTimes.length === 0) return 0;
    
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Determine health status based on success rate and response times
   */
  private determineHealthStatus(successRate: number, avgResponseTime: number): HealthStatus {
    // Unhealthy if success rate is below 90% or average response time > 2 seconds
    if (successRate < 90 || avgResponseTime > 2000) {
      return "unhealthy";
    }
    
    // Degraded if success rate is below 95% or average response time > 500ms
    if (successRate < 95 || avgResponseTime > 500) {
      return "degraded";
    }
    
    return "healthy";
  }

  /**
   * Reset all metrics (useful for testing or manual reset)
   */
  reset(): void {
    this.startTime = Date.now();
    this.responseTimes = [];
    this.totalRequests = 0;
    this.successfulRequests = 0;
    
    this.logger.info("Health middleware reset", {
      service: this.serviceName,
      new_start_time: new Date(this.startTime).toISOString(),
    });
  }

  /**
   * Get basic statistics for debugging
   */
  getStats(): {
    serviceName: string;
    startTime: string;
    uptimeSeconds: number;
    totalRequests: number;
    successfulRequests: number;
    responseTimeEntries: number;
  } {
    return {
      serviceName: this.serviceName,
      startTime: new Date(this.startTime).toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      responseTimeEntries: this.responseTimes.length,
    };
  }
}

/**
 * Create a new health middleware instance for a service
 */
export function createHealthMiddleware(serviceName: string): HealthMiddleware {
  return new HealthMiddleware(serviceName);
}