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
    assert.strictEqual(result.filters.typeLocals, undefined);
    assert.strictEqual(result.filters.yearMin, undefined);
    assert.strictEqual(result.filters.yearMax, undefined);
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

    assert.deepStrictEqual(result.filters.typeLocals, ["Maison"]);
    assert.strictEqual(result.filters.yearMin, "2021");
    assert.strictEqual(result.filters.yearMax, "2021");
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

  it("parses multiple type_local values and year range", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      type_local: ["Maison", "Appartement"],
      year_min: "2020",
      year_max: "2022",
    });

    assert.deepStrictEqual(result.filters.typeLocals, ["Maison", "Appartement"]);
    assert.strictEqual(result.filters.yearMin, "2020");
    assert.strictEqual(result.filters.yearMax, "2022");
  });

  it("rejects inverted year range", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
          west: "5.0",
          year_min: "2022",
          year_max: "2020",
        }),
      /year_min must be less than or equal to year_max/,
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

  it("returns price-per-sqm stats for the bounding box", () => {
    const result = queryDvfInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { limit: 2000 },
      dbPath,
    );

    assert.ok(result.stats.averagePricePerSqm !== null);
    assert.ok(result.stats.averagePricePerSqm! > 0);
    assert.ok(result.stats.minPricePerSqm! <= result.stats.averagePricePerSqm!);
    assert.ok(result.stats.averagePricePerSqm! <= result.stats.maxPricePerSqm!);
  });

  it("filters stats by type_local and year", () => {
    const unfiltered = queryDvfInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { limit: 2000 },
      dbPath,
    );

    const filtered = queryDvfInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { limit: 2000, typeLocals: ["Maison"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.ok(filtered.stats.averagePricePerSqm !== null);
    assert.notStrictEqual(
      filtered.stats.averagePricePerSqm,
      unfiltered.stats.averagePricePerSqm,
    );
  });

  it("returns null stats when no rows have valid surface", () => {
    const result = queryDvfInBounds(
      {
        north: 46.225,
        south: 46.223,
        east: 4.845,
        west: 4.843,
      },
      { limit: 2000, typeLocals: ["Dépendance"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.strictEqual(result.stats.averagePricePerSqm, null);
    assert.strictEqual(result.stats.minPricePerSqm, null);
    assert.strictEqual(result.stats.maxPricePerSqm, null);
  });

  it("filters by type_local and year", () => {
    const result = queryDvfInBounds(
      {
        north: 46.5,
        south: 46.2,
        east: 5.5,
        west: 5.0,
      },
      { limit: 2000, typeLocals: ["Maison"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.ok(result.points.length > 0);
    assert.ok(result.points.every((point) => point.type_local === "Maison"));
    assert.ok(result.points.every((point) => point.date_mutation.startsWith("2021")));
  });

  it("filters by year range", () => {
    const result = queryDvfInBounds(
      {
        north: 46.5,
        south: 46.2,
        east: 5.5,
        west: 5.0,
      },
      { limit: 2000, yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.ok(result.points.length > 0);
    assert.ok(
      result.points.every((point) => point.date_mutation.startsWith("2021")),
    );
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
