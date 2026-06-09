import type { ConsolaInstance } from "consola";
import { createConsola } from "consola";
import diagnosticsChannel from "node:diagnostics_channel";
import type { SQLInputValue } from "node:sqlite";
import { DatabaseSync } from "node:sqlite";

let sqlLogger: ConsolaInstance = createConsola({}).withTag("sql");
let globalTracingActive = false;

function shouldLogSql(): boolean {
  if (process.env.LOG_SQL === "0") {
    return false;
  }

  if (process.env.LOG_SQL === "1") {
    return true;
  }

  if (import.meta.dev === true) {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

export function initSqlLogging(logger?: ConsolaInstance): void {
  if (logger) {
    sqlLogger = logger.withTag("sql");
  }

  if (!shouldLogSql() || globalTracingActive) {
    return;
  }

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor < 24) {
    return;
  }

  try {
    diagnosticsChannel.subscribe("sqlite.db.query", (message) => {
      if (typeof message === "string") {
        sqlLogger.info(message.trim());
      }
    });
    globalTracingActive = true;
  } catch {
    // diagnostics_channel tracing is unavailable on this Node version
  }
}

function logSql(sql: string, params: readonly unknown[] = []): void {
  if (!shouldLogSql() || globalTracingActive) {
    return;
  }

  const trimmedSql = sql.trim();
  const message =
    params.length === 0
      ? trimmedSql
      : `${trimmedSql}\n  params: ${JSON.stringify(params)}`;

  console.log(`[sql] ${message}`);
  sqlLogger.info(message);
}

export function openDatabase(path: string): DatabaseSync {
  return new DatabaseSync(path);
}

export function queryAll<T>(
  db: DatabaseSync,
  sql: string,
  params: readonly unknown[] = [],
): T[] {
  console.log("[sql] queryAll called", shouldLogSql(), globalTracingActive);
  logSql(sql, params);
  return db.prepare(sql).all(...(params as SQLInputValue[])) as T[];
}

export function queryGet<T>(
  db: DatabaseSync,
  sql: string,
  params: readonly unknown[] = [],
): T | undefined {
  logSql(sql, params);
  return db.prepare(sql).get(...(params as SQLInputValue[])) as T | undefined;
}
