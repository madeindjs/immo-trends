import assert from "node:assert";
import { describe, it } from "node:test";
import {
  formatMutationDate,
  formatTrendMonthLabel,
  formatTrendPeriodLabel,
} from "./format-date.ts";

describe("formatTrendMonthLabel", () => {
  it("formats YYYY-MM months with Intl in French", () => {
    assert.match(formatTrendMonthLabel("2021-01"), /janv.*2021/i);
  });

  it("returns a fallback for invalid months", () => {
    assert.strictEqual(formatTrendMonthLabel("invalid"), "invalid");
    assert.strictEqual(formatTrendMonthLabel(null), "—");
  });
});

describe("formatTrendPeriodLabel", () => {
  it("formats quarterly periods", () => {
    assert.strictEqual(formatTrendPeriodLabel("2021-Q1", "quarter"), "T1 2021");
  });

  it("formats yearly periods", () => {
    assert.strictEqual(formatTrendPeriodLabel("2021", "year"), "2021");
  });
});

describe("formatMutationDate", () => {
  it("formats ISO dates with Intl in French", () => {
    assert.strictEqual(formatMutationDate("2021-01-05"), "5 janvier 2021");
  });

  it("returns a fallback for invalid dates", () => {
    assert.strictEqual(formatMutationDate("not-a-date"), "not-a-date");
    assert.strictEqual(formatMutationDate(null), "—");
  });
});
