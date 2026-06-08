import assert from "node:assert";
import { describe, it } from "node:test";
import { formatPricePerSqm, formatPropertyPrice } from "./format-price.ts";

describe("formatPropertyPrice", () => {
  it("uses visible spaces as thousand separators", () => {
    assert.strictEqual(formatPropertyPrice("185000"), "185 000 €");
    assert.doesNotMatch(formatPropertyPrice("185000"), /\u202f/);
  });
});

describe("formatPricePerSqm", () => {
  it("uses visible spaces as thousand separators", () => {
    assert.strictEqual(formatPricePerSqm(2450.5), "2 451 €");
    assert.doesNotMatch(formatPricePerSqm(2450.5), /\u202f/);
  });
});
