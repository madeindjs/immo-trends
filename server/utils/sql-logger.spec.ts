import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import { createSampleDb, removeSampleDb } from "../../test-data/setup-test-db.ts";
import { initSqlLogging, openDatabase, queryAll } from "./sql-logger.ts";

describe("sql-logger", () => {
  let dbPath: string;

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("runs queries through queryAll without throwing", () => {
    initSqlLogging();
    const db = openDatabase(dbPath);

    try {
      const rows = queryAll<{ count: number }>(
        db,
        "SELECT COUNT(*) AS count FROM dvf",
      );
      const firstRow = rows[0];
      assert.ok(firstRow !== undefined && firstRow.count > 0);
    } finally {
      db.close();
    }
  });
});
