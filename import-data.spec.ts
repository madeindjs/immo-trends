import assert from "node:assert";
import { describe, it } from "node:test";

// Import the helper functions
import {
  parseDateFr,
  parseIntFr,
  parseFloatFr,
} from "./import-data-helpers.ts";

describe("import-data helpers", () => {
  describe("parseDateFr", () => {
    it("should parse French date format DD/MM/YYYY to ISO YYYY-MM-DD", () => {
      assert.strictEqual(parseDateFr("05/01/2021"), "2021-01-05");
      assert.strictEqual(parseDateFr("15/03/2021"), "2021-03-15");
      assert.strictEqual(parseDateFr("20/12/2021"), "2021-12-20");
    });

    it("should handle single digit days and months", () => {
      assert.strictEqual(parseDateFr("5/1/2021"), "2021-01-05");
      assert.strictEqual(parseDateFr("1/5/2021"), "2021-05-01");
    });

    it("should return undefined for invalid formats", () => {
      assert.strictEqual(parseDateFr(""), undefined);
      assert.strictEqual(parseDateFr("invalid"), undefined);
      assert.strictEqual(parseDateFr("05-01-2021"), undefined);
      assert.strictEqual(parseDateFr("05/01"), undefined);
    });
  });

  describe("parseIntFr", () => {
    it("should parse French integer format with comma decimal", () => {
      assert.strictEqual(parseIntFr("185000,00"), 185000);
      assert.strictEqual(parseIntFr("10,00"), 10);
      assert.strictEqual(parseIntFr("250000,50"), 250000);
      assert.strictEqual(parseIntFr("300000"), 300000);
    });

    it("should return undefined for invalid values", () => {
      assert.strictEqual(parseIntFr(""), undefined);
      assert.strictEqual(parseIntFr("invalid"), undefined);
    });
  });

  describe("parseFloatFr", () => {
    it("should parse French float format with comma decimal", () => {
      assert.strictEqual(parseFloatFr("2410"), 2410.0);
      assert.strictEqual(parseFloatFr("530"), 530.0);
      assert.strictEqual(parseFloatFr("50,5"), 50.5);
      assert.strictEqual(parseFloatFr("120"), 120.0);
    });

    it("should return undefined for invalid values", () => {
      assert.strictEqual(parseFloatFr(""), undefined);
      assert.strictEqual(parseFloatFr("invalid"), undefined);
    });
  });
});
