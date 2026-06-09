import assert from "node:assert";
import { describe, it } from "node:test";
import { getTrendPeriod, matchesTrendPeriod } from "./trend-period.ts";

describe("getTrendPeriod", () => {
  it("returns YYYY-MM for monthly grouping", () => {
    assert.strictEqual(getTrendPeriod("2021-03-15", "month"), "2021-03");
  });

  it("returns YYYY-Qn for quarterly grouping", () => {
    assert.strictEqual(getTrendPeriod("2021-03-15", "quarter"), "2021-Q1");
    assert.strictEqual(getTrendPeriod("2021-08-15", "quarter"), "2021-Q3");
  });

  it("returns YYYY for yearly grouping", () => {
    assert.strictEqual(getTrendPeriod("2021-03-15", "year"), "2021");
  });
});

describe("matchesTrendPeriod", () => {
  it("matches transactions in the selected period", () => {
    assert.strictEqual(
      matchesTrendPeriod("2021-02-10", "2021-Q1", "quarter"),
      true,
    );
    assert.strictEqual(
      matchesTrendPeriod("2021-05-10", "2021-Q1", "quarter"),
      false,
    );
  });
});
