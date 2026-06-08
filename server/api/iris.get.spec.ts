import assert from "node:assert";
import { after, before, describe, it } from "node:test";
import {
  createSampleDb,
  removeSampleDb,
} from "../../test-data/setup-test-db.ts";
import {
  isIrisDbAvailable,
  queryIrisByCode,
  queryIrisInBounds,
} from "../utils/iris-db.ts";
import { parseIrisQuery } from "../utils/iris-query.ts";

describe("parseIrisQuery", () => {
  it("parses required bounds and default limit", () => {
    const result = parseIrisQuery({
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
    assert.strictEqual(result.limit, 500);
  });

  it("parses optional limit", () => {
    const result = parseIrisQuery({
      north: "46.5",
      south: "46.2",
      east: "5.5",
      west: "5.0",
      limit: "10",
    });

    assert.strictEqual(result.limit, 10);
  });

  it("rejects missing bounds", () => {
    assert.throws(
      () =>
        parseIrisQuery({
          north: "46.5",
          south: "46.2",
          east: "5.5",
        }),
      /Missing required parameter: west/,
    );
  });
});

describe("queryIrisInBounds", () => {
  let dbPath = "";

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("returns IRIS zones inside the bounding box", () => {
    const result = queryIrisInBounds(
      {
        north: 46.33,
        south: 46.32,
        east: 5.39,
        west: 5.38,
      },
      500,
      dbPath,
    );

    assert.strictEqual(result.type, "FeatureCollection");
    assert.strictEqual(result.features.length, 1);
    assert.strictEqual(result.features[0]?.properties.code_iris, "014260001");
    assert.strictEqual(result.features[0]?.properties.nom_com, "Val-Revermont");
  });

  it("returns multiple zones for a larger bounding box", () => {
    const result = queryIrisInBounds(
      {
        north: 47.0,
        south: 46.0,
        east: 6.0,
        west: 4.0,
      },
      500,
      dbPath,
    );

    assert.ok(result.features.length >= 2);
  });
});

describe("queryIrisByCode", () => {
  let dbPath = "";

  before(() => {
    dbPath = createSampleDb();
  });

  after(() => {
    removeSampleDb(dbPath);
  });

  it("returns a zone by code_iris", () => {
    const feature = queryIrisByCode("014260001", dbPath);

    assert.ok(feature);
    assert.strictEqual(feature?.properties.code_iris, "014260001");
    assert.strictEqual(feature?.type, "Feature");
  });

  it("returns null for an unknown code_iris", () => {
    const feature = queryIrisByCode("999999999", dbPath);
    assert.strictEqual(feature, null);
  });
});

describe("isIrisDbAvailable", () => {
  it("returns false for a missing database file", () => {
    assert.strictEqual(
      isIrisDbAvailable("/tmp/dvf-missing-iris-test-db.sqlite3"),
      false,
    );
  });
});
