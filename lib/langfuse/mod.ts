import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import {
  Langfuse,
  type LangfuseGenerationClient,
  type LangfuseSpanClient,
  type LangfuseTraceClient,
} from "npm:langfuse@3.38.5";
import { createLogger } from "../logger.ts";

const logger = createLogger("langfuse-utils");

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

let langfuseClient: Langfuse | null = null;

function getLangfuse(): Langfuse {
  if (!langfuseClient) {
    const config = validateEnv();
    langfuseClient = new Langfuse({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
      flushAt: 1,
    });
    logger.info("Langfuse client initialized");
  }
  return langfuseClient;
}

function createTrace(
  name: string,
  options: {
    traceId?: string;
    userId?: string;
    input?: unknown;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }
): LangfuseTraceClient {
  const langfuse = getLangfuse();

  logger.info(`Creating trace: ${name}`, { traceId: options.traceId });

  const traceParams: {
    id: string;
    name: string;
    userId?: string;
    input?: unknown;
    tags?: string[];
    metadata?: Record<string, unknown>;
  } = {
    id: options.traceId ?? nanoid(),
    name,
  };

  if (options.userId !== undefined) {
    traceParams.userId = options.userId;
  }
  if (options.input !== undefined) {
    traceParams.input = options.input;
  }
  if (options.tags !== undefined) {
    traceParams.tags = options.tags;
  }
  if (options.metadata !== undefined) {
    traceParams.metadata = options.metadata;
  }

  return langfuse.trace(traceParams);
}

function createSpan(
  trace: LangfuseTraceClient,
  name: string,
  options: {
    input?: unknown;
    metadata?: Record<string, unknown>;
  }
): LangfuseSpanClient {
  logger.info(`Creating span: ${name}`, { traceId: trace.id });

  return trace.span({
    name,
    input: options.input,
    metadata: options.metadata,
  });
}

function createGeneration(
  parent: LangfuseSpanClient,
  name: string,
  options: {
    model: string;
    modelParameters?: Record<
      string,
      string | number | boolean | string[] | null
    >;
    input: unknown;
    metadata?: Record<string, unknown>;
  }
): LangfuseGenerationClient {
  logger.info(`Creating generation: ${name}`, {
    parentId: parent.id,
    model: options.model,
  });

  const generationParams: {
    name: string;
    model: string;
    input: unknown;
    modelParameters?: Record<string, string | number | boolean | string[] | null>;
    metadata?: Record<string, unknown>;
  } = {
    name,
    model: options.model,
    input: options.input,
  };

  if (options.modelParameters !== undefined) {
    generationParams.modelParameters = options.modelParameters;
  }
  if (options.metadata !== undefined) {
    generationParams.metadata = options.metadata;
  }

  return parent.generation(generationParams);
}

function completeTrace(trace: LangfuseTraceClient, finalOutput: unknown): void {
  logger.info(`Completing trace`, { traceId: trace.id });
  trace.update({ output: finalOutput });
}

async function flushEvents(): Promise<void> {
  if (langfuseClient) {
    logger.info("Flushing Langfuse events");
    await langfuseClient.flushAsync();
  }
}

function extractTraceContext(headers: Headers): {
  traceId?: string;
  parentId?: string;
} {
  const result: { traceId?: string; parentId?: string } = {};

  const traceId = headers.get("x-langfuse-trace-id");
  if (traceId !== null) {
    result.traceId = traceId;
  }

  const parentId = headers.get("x-langfuse-parent-id");
  if (parentId !== null) {
    result.parentId = parentId;
  }

  return result;
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
  completeTrace,
  extractTraceContext,
  flushEvents,
};
