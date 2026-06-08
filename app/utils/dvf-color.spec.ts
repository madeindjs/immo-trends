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

  it("returns green-700 at median", () => {
    const colors = pricePerSqmToColor(2000, sampleStats);
    assert.strictEqual(colors.fillColor, "#15803d");
  });

  it("returns sky-700 at minimum", () => {
    const colors = pricePerSqmToColor(1000, sampleStats);
    assert.strictEqual(colors.fillColor, "#0369a1");
  });

  it("returns red-700 at maximum", () => {
    const colors = pricePerSqmToColor(3000, sampleStats);
    assert.strictEqual(colors.fillColor, "#b91c1c");
  });

  it("returns a cool color below median", () => {
    const colors = pricePerSqmToColor(1500, sampleStats);
    assert.ok(
      ["#047857", "#0f766e", "#0e7490", "#0369a1"].includes(colors.fillColor),
    );
  });

  it("returns a warm color above median", () => {
    const colors = pricePerSqmToColor(2500, sampleStats);
    assert.ok(
      ["#b91c1c", "#c2410c", "#b45309", "#a16207", "#4d7c0f"].includes(
        colors.fillColor,
      ),
    );
  });
});
