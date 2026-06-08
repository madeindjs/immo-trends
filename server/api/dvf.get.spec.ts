import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import {
  createSampleDb,
  removeSampleDb,
} from "../../test-data/setup-test-db.ts";
import { isDbAvailable, queryDvfInBounds } from "../utils/dvf-db.ts";
import { parseDvfQuery } from "../utils/dvf-query.ts";

describe("parseDvfQuery", () => {
  it("parses required bounds and default limit", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
    });

    assert.deepStrictEqual(result.bounds, {
      north: 46.5,
      south: 46.2,
      east: 5.5,
      west: 5.0,
    });
    assert.strictEqual(result.filters.limit, 2000);
    assert.strictEqual(result.filters.typeLocal, undefined);
    assert.strictEqual(result.filters.year, undefined);
  });

  it("parses optional filters", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      type_local: "Maison",
      year: "2021",
      limit: "10",
    });

    assert.strictEqual(result.filters.typeLocal, "Maison");
    assert.strictEqual(result.filters.year, "2021");
    assert.strictEqual(result.filters.limit, 10);
  });

  it("rejects missing bounds", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
        }),
      /Missing required parameter: west/,
    );
  });

  it("rejects inverted bounds", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.2",
          south: "46.5",
          east: "5.5",
          west: "5.0",
        }),
      /south must be less than or equal to north/,
    );

    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.0",
          west: "5.5",
        }),
      /west must be less than or equal to east/,
    );
  });

  it("rejects invalid year", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
          west: "5.0",
          year: "21",
        }),
      /Invalid year parameter/,
    );
  });
});

describe("queryDvfInBounds", () => {
  let dbPath = "";

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("returns points inside the bounding box", () => {
    const result = queryDvfInBounds(
      {
        north: 46.33,
        south: 46.32,
        east: 5.39,
        west: 5.38,
      },
      { limit: 2000 },
      dbPath,
    );

    assert.ok(result.points.length >= 2);
    assert.strictEqual(result.points[0]?.nom_commune, "Val-Revermont");
  });

  it("filters by type_local and year", () => {
    const result = queryDvfInBounds(
      {
        north: 46.5,
        south: 46.2,
        east: 5.5,
        west: 5.0,
      },
      { limit: 2000, typeLocal: "Maison", year: "2021" },
      dbPath,
    );

    assert.ok(result.points.length > 0);
    assert.ok(result.points.every((point) => point.type_local === "Maison"));
    assert.ok(result.points.every((point) => point.date_mutation.startsWith("2021")));
  });

  it("marks truncated results when limit is reached", () => {
    const result = queryDvfInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { limit: 1 },
      dbPath,
    );

    assert.strictEqual(result.points.length, 1);
    assert.strictEqual(result.truncated, true);
  });
});

describe("isDbAvailable", () => {
  it("returns false for a missing database file", () => {
    assert.strictEqual(
      isDbAvailable("/tmp/dvf-missing-test-db.sqlite3"),
      false,
    );
  });
});
