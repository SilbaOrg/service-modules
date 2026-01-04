import { createLogger } from "./logger.ts";

const logger = createLogger("retry", { module: "retry" });

export class RetryExhaustedError extends Error {
  readonly attempts: number;
  readonly operationName: string;
  readonly attemptErrors: string[];

  constructor(
    operationName: string,
    attempts: number,
    attemptErrors: string[],
    lastError: Error
  ) {
    const errorHistory = attemptErrors
      .map((err, i) => `Attempt ${i + 1}: ${err}`)
      .join(" | ");

    super(
      `${operationName} failed after ${attempts} attempts. Errors: ${errorHistory}`
    );

    this.name = "RetryExhaustedError";
    this.operationName = operationName;
    this.attempts = attempts;
    this.attemptErrors = attemptErrors;
    this.cause = lastError;
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  delays: number[],
  operationName: string
): Promise<T> {
  const totalAttempts = delays.length + 1;
  const attemptErrors: string[] = [];

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    const isLastAttempt = attempt === totalAttempts;

    try {
      const result = await fn();

      if (attempt > 1) {
        logger.info(`${operationName} succeeded after retry`, {
          operation: "retry_success",
          operation_name: operationName,
          successful_attempt: attempt,
          total_attempts: attempt,
          previous_errors: attemptErrors.join(" | "),
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      attemptErrors.push(errorMessage);

      if (isLastAttempt) {
        logger.error(`${operationName} failed after all retries`, {
          operation: "retry_exhausted",
          operation_name: operationName,
          attempts: attempt,
          error_history: attemptErrors.join(" | "),
        });

        throw new RetryExhaustedError(
          operationName,
          attempt,
          attemptErrors,
          error instanceof Error ? error : new Error(errorMessage)
        );
      }

      const delayMs = delays[attempt - 1];

      logger.warn(`${operationName} failed, retrying`, {
        operation: "retry_attempt_failed",
        operation_name: operationName,
        attempt,
        max_attempts: totalAttempts,
        delay_ms: delayMs,
        error_message: errorMessage,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`${operationName}: unreachable code in retry loop`);
}
