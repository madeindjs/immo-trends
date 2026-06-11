import assert from "node:assert";
import { describe, it } from "node:test";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  buildUrlQuery,
  getDefaultFilters,
  normalizeCenter,
  parseUrlState,
  urlQueriesEqual,
} from "./url-state.ts";

describe("parseUrlState", () => {
  it("returns defaults for an empty query", () => {
    const state = parseUrlState({});

    assert.strictEqual(state.zoom, DEFAULT_ZOOM);
    assert.deepStrictEqual(state.center, DEFAULT_CENTER);
    assert.deepStrictEqual(state.filters, getDefaultFilters());
  });

  it("parses map and filter params", () => {
    const state = parseUrlState({
      zoom: "12",
      lat: "45.764",
      lng: "4.835",
      type_local: ["Appartement"],
      year_min: "2018",
      year_max: "2022",
      surface_min: "50",
      price_per_sqm_max: "5000",
    });

    assert.strictEqual(state.zoom, 12);
    assert.deepStrictEqual(state.center, [45.764, 4.835]);
    assert.deepStrictEqual(state.filters.typeLocals, ["Appartement"]);
    assert.strictEqual(state.filters.yearMin, 2018);
    assert.strictEqual(state.filters.yearMax, 2022);
    assert.strictEqual(state.filters.surfaceMin, 50);
    assert.strictEqual(state.filters.surfaceMax, null);
    assert.strictEqual(state.filters.pricePerSqmMin, null);
    assert.strictEqual(state.filters.pricePerSqmMax, 5000);
  });

  it("parses comma-separated type_local values", () => {
    const state = parseUrlState({
      type_local: "Maison,Appartement",
    });

    assert.deepStrictEqual(state.filters.typeLocals, ["Maison", "Appartement"]);
  });

  it("falls back to defaults for invalid values", () => {
    const state = parseUrlState({
      zoom: "invalid",
      lat: "bad",
      lng: "4.835",
      year_min: "20xx",
      surface_min: "-1",
    });

    assert.strictEqual(state.zoom, DEFAULT_ZOOM);
    assert.deepStrictEqual(state.center, DEFAULT_CENTER);
    assert.strictEqual(state.filters.yearMin, getDefaultFilters().yearMin);
    assert.strictEqual(state.filters.surfaceMin, null);
  });
});

describe("normalizeCenter", () => {
  it("reads coordinates from Leaflet-style lat/lng objects", () => {
    assert.deepStrictEqual(
      normalizeCenter({ lat: 45.764, lng: 4.835 }),
      [45.764, 4.835],
    );
  });

  it("falls back to defaults for invalid coordinates", () => {
    assert.deepStrictEqual(normalizeCenter([Number.NaN, 4.835]), DEFAULT_CENTER);
    assert.deepStrictEqual(normalizeCenter({ lat: "bad", lng: 4.835 }), DEFAULT_CENTER);
  });
});

describe("buildUrlQuery", () => {
  it("does not serialize invalid coordinates", () => {
    const query = buildUrlQuery({
      zoom: 9,
      center: [Number.NaN, Number.NaN],
      filters: {
        typeLocals: ["Maison"],
        yearMin: getDefaultFilters().yearMin,
        yearMax: getDefaultFilters().yearMax,
        surfaceMin: null,
        surfaceMax: null,
        surfaceTerrainMin: null,
        surfaceTerrainMax: null,
        pricePerSqmMin: null,
        pricePerSqmMax: null,
        roomsMin: null,
        roomsMax: null,
      },
    });

    assert.deepStrictEqual(query, {
      zoom: "9",
      type_local: ["Maison"],
    });
  });
  it("omits default values", () => {
    const query = buildUrlQuery({
      zoom: DEFAULT_ZOOM,
      center: DEFAULT_CENTER,
      filters: getDefaultFilters(),
    });

    assert.deepStrictEqual(query, {});
  });

  it("serializes non-default state", () => {
    const query = buildUrlQuery({
      zoom: 12,
      center: [45.764, 4.835],
      filters: {
        typeLocals: ["Maison"],
        yearMin: 2018,
        yearMax: 2022,
        surfaceMin: 50,
        surfaceMax: null,
        surfaceTerrainMin: null,
        surfaceTerrainMax: null,
        pricePerSqmMin: null,
        pricePerSqmMax: 5000,
        roomsMin: null,
        roomsMax: null,
      },
    });

    assert.deepStrictEqual(query, {
      zoom: "12",
      lat: "45.764",
      lng: "4.835",
      type_local: ["Maison"],
      year_min: "2018",
      year_max: "2022",
      surface_min: "50",
      price_per_sqm_max: "5000",
    });
  });
});

describe("url state round-trip", () => {
  it("preserves non-default state through parse and build", () => {
    const initial = {
      zoom: 11,
      center: [48.8566, 2.3522] as [number, number],
      filters: {
        typeLocals: ["Appartement"],
        yearMin: 2016,
        yearMax: 2020,
        surfaceMin: 30,
        surfaceMax: 90,
        surfaceTerrainMin: 500,
        surfaceTerrainMax: 2000,
        pricePerSqmMin: 1500,
        pricePerSqmMax: 4000,
        roomsMin: 2,
        roomsMax: 4,
      },
    };

    const parsed = parseUrlState(buildUrlQuery(initial));

    assert.strictEqual(parsed.zoom, initial.zoom);
    assert.deepStrictEqual(parsed.center, initial.center);
    assert.deepStrictEqual(parsed.filters, initial.filters);
  });
});

describe("urlQueriesEqual", () => {
  it("treats equivalent queries as equal", () => {
    assert.strictEqual(
      urlQueriesEqual(
        { type_local: ["Maison", "Appartement"] },
        { type_local: ["Appartement", "Maison"] },
      ),
      true,
    );
  });

  it("detects different queries", () => {
    assert.strictEqual(
      urlQueriesEqual({ zoom: "10" }, { zoom: "11" }),
      false,
    );
  });
});
