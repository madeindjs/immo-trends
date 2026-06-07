import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getMedian,
  getPriceStats,
  calculatePricePerSqm,
} from "./draw.utils.ts";

describe("getMedian", () => {
  it("should return 0 for empty array", () => {
    assert.strictEqual(getMedian([]), 0);
  });

  it("should return the single element", () => {
    assert.strictEqual(getMedian([5]), 5);
  });

  it("should return middle element for odd length", () => {
    assert.strictEqual(getMedian([1, 3, 5]), 3);
  });

  it("should return average of middle two for even length", () => {
    assert.strictEqual(getMedian([1, 3, 5, 7]), 4);
  });

  it("should work with unsorted array", () => {
    assert.strictEqual(getMedian([7, 1, 5, 3]), 4);
  });

  it("should work with negative numbers", () => {
    assert.strictEqual(getMedian([-2, -1, 0, 1, 2]), 0);
  });

  it("should work with decimal numbers", () => {
    assert.strictEqual(getMedian([1.5, 2.5, 3.5]), 2.5);
  });
});

describe("getPriceStats", () => {
  it("should return null for empty array", () => {
    assert.strictEqual(getPriceStats([]), null);
  });

  it("should calculate stats for single price", () => {
    const stats = getPriceStats([100]);
    assert.notStrictEqual(stats, null);
    assert.strictEqual(stats?.median, 100);
    assert.strictEqual(stats?.average, 100);
    assert.strictEqual(stats?.min, 100);
    assert.strictEqual(stats?.max, 100);
    assert.strictEqual(stats?.count, 1);
  });

  it("should calculate stats for multiple prices", () => {
    const stats = getPriceStats([100, 200, 300]);
    assert.notStrictEqual(stats, null);
    assert.strictEqual(stats?.median, 200);
    assert.strictEqual(stats?.average, 200);
    assert.strictEqual(stats?.min, 100);
    assert.strictEqual(stats?.max, 300);
    assert.strictEqual(stats?.count, 3);
  });

  it("should filter out NaN values", () => {
    const stats = getPriceStats([100, NaN, 200, NaN]);
    assert.notStrictEqual(stats, null);
    assert.strictEqual(stats?.count, 2);
    assert.strictEqual(stats?.median, 150);
  });
});

describe("calculatePricePerSqm", () => {
  it("should calculate price from string value", () => {
    assert.strictEqual(calculatePricePerSqm("100000", 50), 2000);
  });

  it("should calculate price from number value", () => {
    assert.strictEqual(calculatePricePerSqm(100000, 50), 2000);
  });

  it("should handle decimal values", () => {
    assert.strictEqual(calculatePricePerSqm("100000.50", 50), 2000.01);
  });

  it("should return null for null value", () => {
    assert.strictEqual(calculatePricePerSqm(null, 50), null);
  });

  it("should return null for null surface", () => {
    assert.strictEqual(calculatePricePerSqm("100000", null), null);
  });

  it("should return null for undefined value", () => {
    assert.strictEqual(calculatePricePerSqm(undefined, 50), null);
  });

  it("should return null for zero surface", () => {
    assert.strictEqual(calculatePricePerSqm("100000", 0), null);
  });

  it("should return null for negative surface", () => {
    assert.strictEqual(calculatePricePerSqm("100000", -10), null);
  });

  it("should return null for invalid number string", () => {
    assert.strictEqual(calculatePricePerSqm("not a number", 50), null);
  });

  it("should return null for empty string", () => {
    assert.strictEqual(calculatePricePerSqm("", 50), null);
  });
});
