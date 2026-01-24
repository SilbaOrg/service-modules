import { DatabaseSync } from "node:sqlite";
import { ensureDir } from "@std/fs";
import { dirname } from "@std/path";

export function getDatabasePath(): string {
  const databasePath = Deno.env.get("DATABASE_PATH");
  if (databasePath === undefined) {
    throw new Error("DATABASE_PATH environment variable is not set");
  }
  return databasePath;
}

export async function ensureDatabaseDirectory(): Promise<void> {
  const databasePath = getDatabasePath();
  const directory = dirname(databasePath);
  await ensureDir(directory);
}

export const STANDARD_PRAGMAS = [
  "PRAGMA journal_mode=WAL",
  "PRAGMA synchronous=NORMAL",
  "PRAGMA foreign_keys=ON",
  "PRAGMA busy_timeout=5000",
] as const;

export function applyStandardPragmas(database: DatabaseSync): void {
  for (const pragma of STANDARD_PRAGMAS) {
    database.exec(pragma);
  }
}

export type DatabaseStats = {
  path: string;
  sizeBytes: number;
  pageCount: number;
  pageSize: number;
  walSizeBytes: number;
};

export function getDatabaseStats(database: DatabaseSync): DatabaseStats {
  const path = getDatabasePath();

  const pageCountResult = database
    .prepare("PRAGMA page_count")
    .get() as { page_count: number };
  const pageSizeResult = database
    .prepare("PRAGMA page_size")
    .get() as { page_size: number };

  const pageCount = pageCountResult.page_count;
  const pageSize = pageSizeResult.page_size;
  const sizeBytes = pageCount * pageSize;

  let walSizeBytes = 0;
  try {
    const walPath = `${path}-wal`;
    const walStat = Deno.statSync(walPath);
    walSizeBytes = walStat.size;
  } catch {
    // WAL file may not exist yet
  }

  return {
    path,
    sizeBytes,
    pageCount,
    pageSize,
    walSizeBytes,
  };
}
