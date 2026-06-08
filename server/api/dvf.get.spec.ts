import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import {
  createSampleDb,
  removeSampleDb,
} from "../../test-data/setup-test-db.ts";
import {
  isDbAvailable,
  queryDvfByRowid,
  queryDvfInBounds,
} from "../utils/dvf-db.ts";
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

  it("parses surface and price-per-sqm filters", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      surface_min: "50",
      surface_max: "120",
      price_per_sqm_min: "2000",
      price_per_sqm_max: "3000",
    });

    assert.strictEqual(result.filters.surfaceMin, 50);
    assert.strictEqual(result.filters.surfaceMax, 120);
    assert.strictEqual(result.filters.pricePerSqmMin, 2000);
    assert.strictEqual(result.filters.pricePerSqmMax, 3000);
  });

  it("rejects inverted surface range", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
          west: "5.0",
          surface_min: "120",
          surface_max: "50",
        }),
      /surface_min must be less than or equal to surface_max/,
    );
  });

  it("rejects inverted price-per-sqm range", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
          west: "5.0",
          price_per_sqm_min: "3000",
          price_per_sqm_max: "2000",
        }),
      /price_per_sqm_min must be less than or equal to price_per_sqm_max/,
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
    assert.ok(typeof result.points[0]?.rowid === "number");
    assert.ok(result.points[0]!.rowid > 0);
    assert.strictEqual(result.points[0]?.nom_commune, "Val-Revermont");
    assert.strictEqual(result.points[0]?.adresse_numero, "5080");
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

    assert.ok(result.stats.medianPricePerSqm !== null);
    assert.ok(result.stats.medianPricePerSqm! > 0);
    assert.ok(result.stats.minPricePerSqm! <= result.stats.medianPricePerSqm!);
    assert.ok(result.stats.medianPricePerSqm! <= result.stats.maxPricePerSqm!);
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

    assert.ok(filtered.stats.medianPricePerSqm !== null);
    assert.notStrictEqual(
      filtered.stats.medianPricePerSqm,
      unfiltered.stats.medianPricePerSqm,
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

    assert.strictEqual(result.stats.medianPricePerSqm, null);
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

  it("filters by surface range", () => {
    const result = queryDvfInBounds(
      {
        north: 46.33,
        south: 46.32,
        east: 5.39,
        west: 5.38,
      },
      { limit: 2000, surfaceMin: 95, surfaceMax: 100 },
      dbPath,
    );

    assert.ok(result.points.length > 0);
    assert.ok(
      result.points.every(
        (point) =>
          point.surface_reelle_bati != null &&
          point.surface_reelle_bati >= 95 &&
          point.surface_reelle_bati <= 100,
      ),
    );
  });

  it("filters by price per sqm range", () => {
    const result = queryDvfInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      {
        limit: 2000,
        typeLocals: ["Appartement"],
        yearMin: "2021",
        yearMax: "2021",
        pricePerSqmMin: 2400,
        pricePerSqmMax: 2500,
      },
      dbPath,
    );

    assert.ok(result.points.length > 0);
    assert.ok(result.points.every((point) => point.type_local === "Appartement"));
  });

  it("filters by code_iris across the full zone", () => {
    const wideBounds = {
      north: 47.0,
      south: 46.0,
      east: 6.0,
      west: 4.0,
    };

    const unfiltered = queryDvfInBounds(wideBounds, { limit: 2000 }, dbPath);
    const filtered = queryDvfInBounds(
      wideBounds,
      { limit: 2000, codeIris: "014260001" },
      dbPath,
    );

    assert.ok(filtered.points.length > 0);
    assert.ok(filtered.points.length < unfiltered.points.length);
    assert.ok(
      filtered.points.every((point) => point.nom_commune === "Val-Revermont"),
    );
  });
});

describe("parseDvfQuery code_iris", () => {
  it("parses optional code_iris", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      code_iris: "014260001",
    });

    assert.strictEqual(result.filters.codeIris, "014260001");
  });

  it("rejects invalid code_iris", () => {
    assert.throws(
      () =>
        parseDvfQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
          west: "5.0",
          code_iris: "1426",
        }),
      /Invalid code_iris parameter/,
    );
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
