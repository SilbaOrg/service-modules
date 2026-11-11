import { nanoid } from "https://deno.land/x/nanoid@v3.0.0/mod.ts";
import {
  Langfuse,
  type LangfuseGenerationClient,
  type LangfuseSpanClient,
  type LangfuseTraceClient,
} from "npm:langfuse@3.38.5";
import { createLogger } from "../logger.ts";

const logger = createLogger("langfuse-utils");

type LangfuseVariable =
  | "LANGFUSE_PUBLIC_KEY"
  | "LANGFUSE_SECRET_KEY"
  | "LANGFUSE_BASE_URL";

type LangfuseSettings =
  | {
    readonly kind: "enabled";
    readonly publicKey: string;
    readonly secretKey: string;
    readonly baseUrl: string;
  }
  | {
    readonly kind: "disabled";
    readonly missing: ReadonlyArray<LangfuseVariable>;
  };

const langfuseVariables: ReadonlyArray<LangfuseVariable> = [
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
  "LANGFUSE_BASE_URL",
];

function readVariable(name: LangfuseVariable): string | undefined {
  const value = Deno.env.get(name)?.trim();
  return value === undefined || value === "" ? undefined : value;
}

function isUnset(name: LangfuseVariable): boolean {
  return readVariable(name) === undefined;
}

function readSettings(): LangfuseSettings {
  const publicKey = readVariable("LANGFUSE_PUBLIC_KEY");
  const secretKey = readVariable("LANGFUSE_SECRET_KEY");
  const baseUrl = readVariable("LANGFUSE_BASE_URL");

  return publicKey !== undefined && secretKey !== undefined &&
      baseUrl !== undefined
    ? { kind: "enabled", publicKey, secretKey, baseUrl }
    : { kind: "disabled", missing: langfuseVariables.filter(isUnset) };
}

function createClient(settings: LangfuseSettings): Langfuse {
  switch (settings.kind) {
    case "enabled": {
      const { publicKey, secretKey, baseUrl } = settings;
      logger.info("Langfuse tracing enabled", { baseUrl });
      return new Langfuse({ publicKey, secretKey, baseUrl, flushAt: 1 });
    }
    case "disabled": {
      const { missing } = settings;
      logger.info("Langfuse tracing disabled", { missing: missing.join(", ") });
      return new Langfuse({ enabled: false });
    }
  }
}

let langfuseClient: Langfuse | null = null;

function getLangfuse(): Langfuse {
  if (!langfuseClient) {
    langfuseClient = createClient(readSettings());
  }
  return langfuseClient;
}

function isLangfuseEnabled(): boolean {
  return readSettings().kind === "enabled";
}

function createTrace(
  name: string,
  options: {
    traceId?: string;
    userId?: string;
    input?: unknown;
    tags?: string[];
    metadata?: Record<string, unknown>;
  },
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
  },
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
  },
): LangfuseGenerationClient {
  logger.info(`Creating generation: ${name}`, {
    parentId: parent.id,
    model: options.model,
  });

  const generationParams: {
    name: string;
    model: string;
    input: unknown;
    modelParameters?: Record<
      string,
      string | number | boolean | string[] | null
    >;
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
  parentId?: string,
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
  completeTrace,
  createGeneration,
  createSpan,
  createTrace,
  createTraceHeaders,
  extractTraceContext,
  flushEvents,
  isLangfuseEnabled,
};
