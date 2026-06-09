import assert from "node:assert";
import { describe, it } from "node:test";
import { pricePerSqmToColor } from "./dvf-color.ts";

const sampleStats = {
  medianPricePerSqm: 2000,
  minPricePerSqm: 1000,
  maxPricePerSqm: 3000,
};

describe("pricePerSqmToColor", () => {
  it("returns gray for null price", () => {
    const colors = pricePerSqmToColor(null, sampleStats);
    assert.strictEqual(colors.fillColor, "#9ca3af");
    assert.strictEqual(colors.color, "#9ca3af");
  });

  it("returns gray when stats are missing", () => {
    const colors = pricePerSqmToColor(2000, {
      medianPricePerSqm: null,
      minPricePerSqm: null,
      maxPricePerSqm: null,
    });
    assert.strictEqual(colors.fillColor, "#9ca3af");
  });

  it("returns the median scale color at median", () => {
    const colors = pricePerSqmToColor(2000, sampleStats);
    assert.strictEqual(colors.fillColor, "#26838f");
    assert.strictEqual(colors.color, "black");
  });

  it("returns the minimum scale color at minimum", () => {
    const colors = pricePerSqmToColor(1000, sampleStats);
    assert.strictEqual(colors.fillColor, "#fee825");
  });

  it("returns the maximum scale color at maximum", () => {
    const colors = pricePerSqmToColor(3000, sampleStats);
    assert.strictEqual(colors.fillColor, "#440154");
  });

  it("returns a lighter color below median", () => {
    const colors = pricePerSqmToColor(1500, sampleStats);
    assert.strictEqual(colors.fillColor, "#6cce5a");
  });

  it("returns a darker color above median", () => {
    const colors = pricePerSqmToColor(2500, sampleStats);
    assert.strictEqual(colors.fillColor, "#3f4a8a");
  });
});
