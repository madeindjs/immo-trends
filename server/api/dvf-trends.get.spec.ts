import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import {
  createSampleDb,
  removeSampleDb,
} from "../../test-data/setup-test-db.ts";
import { queryDvfPriceTrends } from "../utils/dvf-db.ts";
import { parseDvfQuery } from "../utils/dvf-query.ts";

describe("parseDvfQuery for dvf-trends", () => {
  it("parses required bounds", () => {
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
  });

  it("parses optional filters", () => {
    const result = parseDvfQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      type_local: "Maison",
      year_min: "2020",
      year_max: "2022",
    });

    assert.deepStrictEqual(result.filters.typeLocals, ["Maison"]);
    assert.strictEqual(result.filters.yearMin, "2020");
    assert.strictEqual(result.filters.yearMax, "2022");
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
});

describe("queryDvfPriceTrends", () => {
  let dbPath = "";

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("returns yearly median price per sqm", () => {
    const trends = queryDvfPriceTrends(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      {},
      dbPath,
    );

    assert.ok(trends.length > 0);
    assert.ok(trends.every((point) => Number.isInteger(point.year)));
    assert.ok(
      trends.every(
        (point) => point.medianPricePerSqm !== null && point.count > 0,
      ),
    );
    assert.ok(trends.every((point) => point.medianPricePerSqm! > 0));
  });

  it("filters trends by type_local and year", () => {
    const unfiltered = queryDvfPriceTrends(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      {},
      dbPath,
    );

    const filtered = queryDvfPriceTrends(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { typeLocals: ["Maison"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.ok(filtered.length > 0);
    assert.strictEqual(filtered[0]?.year, 2021);
    assert.notStrictEqual(
      filtered[0]?.medianPricePerSqm,
      unfiltered.find((point) => point.year === 2021)?.medianPricePerSqm,
    );
  });

  it("returns an empty array when no qualifying rows exist", () => {
    const trends = queryDvfPriceTrends(
      {
        north: 46.225,
        south: 46.223,
        east: 4.845,
        west: 4.843,
      },
      { typeLocals: ["Dépendance"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    assert.deepStrictEqual(trends, []);
  });

  it("filters trends by surface and price per sqm", () => {
    const unfiltered = queryDvfPriceTrends(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      { typeLocals: ["Maison"], yearMin: "2021", yearMax: "2021" },
      dbPath,
    );

    const filtered = queryDvfPriceTrends(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      {
        typeLocals: ["Maison"],
        yearMin: "2021",
        yearMax: "2021",
        surfaceMin: 95,
        surfaceMax: 100,
      },
      dbPath,
    );

    assert.ok(filtered.length > 0);
    assert.notStrictEqual(
      filtered[0]?.count,
      unfiltered.find((point) => point.year === 2021)?.count,
    );
  });
});
