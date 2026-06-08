import assert from "node:assert";
import { describe, it } from "node:test";
import { formatMutationDate } from "./format-date.ts";

describe("formatMutationDate", () => {
  it("formats ISO dates with Intl in French", () => {
    assert.strictEqual(formatMutationDate("2021-01-05"), "5 janvier 2021");
  });

  it("returns a fallback for invalid dates", () => {
    assert.strictEqual(formatMutationDate("not-a-date"), "not-a-date");
    assert.strictEqual(formatMutationDate(null), "—");
  });
});
