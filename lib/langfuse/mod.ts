// langfuse-utils.ts
import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import {
  Langfuse,
  type LangfuseGenerationClient,
  type LangfuseSpanClient,
  type LangfuseTraceClient,
} from "https://esm.sh/langfuse";
import { createLogger } from "../logger.ts";
import type { CostDetails } from "../perplexity/cost-calculator.ts";
import type { PerplexityUsage } from "../perplexity/mod.ts";

/**
 * Langfuse Utilities - A reusable module for tracing LLM interactions
 *
 * This module provides utility functions for creating traces, spans, and generations
 * across distributed microservices. It handles environment validation and provides
 * consistent interfaces for tracking LLM calls.
 */

const logger = createLogger("langfuse-utils");

// Load and validate environment variables
function validateEnv(): {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
} {
  const requiredVars = [
    "LANGFUSE_PUBLIC_KEY",
    "LANGFUSE_SECRET_KEY",
    "LANGFUSE_BASE_URL",
  ];
  const missingVars = requiredVars.filter((varName) => !Deno.env.get(varName));

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    publicKey: Deno.env.get("LANGFUSE_PUBLIC_KEY")!,
    secretKey: Deno.env.get("LANGFUSE_SECRET_KEY")!,
    baseUrl: Deno.env.get("LANGFUSE_BASE_URL")!,
  };
}

// Singleton Langfuse client
let langfuseClient: Langfuse | null = null;

/**
 * Initialize and get the Langfuse client
 * This ensures we only create one client per process
 */
function getLangfuse(): Langfuse {
  if (!langfuseClient) {
    const config = validateEnv();
    langfuseClient = new Langfuse({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
      // Add any additional configuration options here
      flushAt: 1, // Immediate flushing for microservices
    });
    logger.info("Langfuse client initialized");
  }
  return langfuseClient;
}

/**
 * Trace - Top level entity representing a complete user request flow
 *
 * Create a trace at the entry point of your application (e.g., API endpoint)
 * and pass the trace ID to other services.
 *
 * @param name A descriptive name for this user interaction/request
 * @param options Additional trace metadata
 * @returns The created trace object
 */
function createTrace(
  name: string,
  options: {
    traceId?: string; // Optional custom ID (use for distributed tracing)
    userId?: string; // User identifier for analytics
    input?: unknown; // The initial user input that started this flow
    tags?: string[]; // Categorization tags
    metadata?: Record<string, unknown>; // Additional context
  }
): LangfuseTraceClient {
  const langfuse = getLangfuse();

  logger.info(`Creating trace: ${name}`, { traceId: options.traceId });

  return langfuse.trace({
    id: options.traceId || nanoid(),
    name,
    userId: options.userId,
    input: options.input,
    tags: options.tags,
    metadata: options.metadata,
  });
}

/**
 * Span - Represents a logical operation or phase within a trace
 *
 * Use spans to group related operations (e.g., "perplexity-research-phase")
 * or to measure duration of operations.
 *
 * @param trace The parent trace object
 * @param name A descriptive name for this operation
 * @param options Additional span options
 * @returns The created span object
 */
function createSpan(
  trace: LangfuseTraceClient,
  name: string,
  options: {
    input?: unknown; // Input to this operation
    metadata?: Record<string, unknown>; // Additional context
  }
): LangfuseSpanClient {
  logger.info(`Creating span: ${name}`, { traceId: trace.id });

  return trace.span({
    name,
    input: options.input,
    metadata: options.metadata,
  });
}

/**
 * Generation - Represents a specific LLM call
 *
 * Use generations to track individual LLM API calls with their
 * associated prompts, completions, and metadata.
 *
 * @param parent The parent trace or span
 * @param name A descriptive name for this LLM generation
 * @param options Generation details
 * @returns The created generation object
 */
function createGeneration(
  parent: LangfuseSpanClient,
  name: string,
  options: {
    model: string; // Model name (e.g., "claude-3-haiku")
    modelParameters?: Record<
      string,
      string | number | boolean | string[] | null
    >; // Temperature, max tokens, etc.
    input: unknown; // The prompt sent to the LLM
    metadata?: Record<string, unknown>; // Additional context
  }
): LangfuseGenerationClient {
  logger.info(`Creating generation: ${name}`, {
    parentId: parent.id,
    model: options.model,
  });

  return parent.generation({
    name,
    model: options.model,
    modelParameters: options.modelParameters,
    input: options.input,
    metadata: options.metadata,
  });
}

/**
 * Format Perplexity query for Langfuse input
 * Use this to properly format the input to a Perplexity generation
 */
function formatPerplexityInput(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
}) {
  return {
    model: params.model,
    messages: params.messages,
  };
}

/**
 * Complete a generation with output data
 * Call this after receiving a response from the LLM
 */
function completeGeneration(
  generation: LangfuseGenerationClient,
  data: {
    output: unknown;
    usage_details: PerplexityUsage;
    cost_details: CostDetails;
    error?: Error | string;
  }
) {
  if (data.error) {
    const errorMessage =
      data.error instanceof Error ? data.error.message : String(data.error);
    logger.warn(`Generation ended with error: ${errorMessage}`, {
      generationId: generation.id,
    });

    generation.end({
      output: null,
      level: "ERROR",
      statusMessage: errorMessage,
    });
  } else {
    logger.info(`Generation completed successfully`, {
      generationId: generation.id,
    });

    const usage = {
      input: data.usage_details.prompt_tokens,
      output: data.usage_details.completion_tokens,
      total: data.usage_details.total_tokens,
    };

    const cost = {
      input: data.cost_details.input,
      output: data.cost_details.output,
      total: data.cost_details.total,
    };

    // End the generation with success and usage/cost information
    generation.end({
      output: data.output,
      usage,
      costDetails: cost,
    });
  }
}

/**
 * Complete a trace with the final output
 * Call this at the end of the complete flow
 */
function completeTrace(trace: LangfuseTraceClient, finalOutput: unknown) {
  logger.info(`Completing trace`, { traceId: trace.id });
  trace.update({ output: finalOutput });
}

/**
 * Ensure all pending events are sent to Langfuse
 * Call this before your service terminates
 */
async function flushEvents() {
  if (langfuseClient) {
    logger.info("Flushing Langfuse events");
    await langfuseClient.flushAsync();
  }
}

// Example usage pattern for distributed tracing
function extractTraceContext(headers: Headers): {
  traceId?: string;
  parentId?: string;
} {
  return {
    traceId: headers.get("x-langfuse-trace-id") || undefined,
    parentId: headers.get("x-langfuse-parent-id") || undefined,
  };
}

function createTraceHeaders(
  traceId: string,
  parentId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "x-langfuse-trace-id": traceId,
  };

  if (parentId) {
    headers["x-langfuse-parent-id"] = parentId;
  }

  return headers;
}

export {
  createTrace,
  createSpan,
  createGeneration,
  createTraceHeaders,
  completeGeneration,
  completeTrace,
  extractTraceContext,
  flushEvents,
  formatPerplexityInput,
};
