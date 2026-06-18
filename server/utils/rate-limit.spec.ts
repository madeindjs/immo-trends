import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  checkRateLimit,
  clearRateLimitNow,
  getRateLimitStore,
  pruneRateLimitStore,
  resetRateLimitStore,
  setRateLimitNow,
} from "./rate-limit.ts";

const OPTS = { limit: 3, windowMs: 10_000, cooldownMs: 60_000 };

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
    setRateLimitNow(() => 1_000_000);
  });

  afterEach(() => {
    clearRateLimitNow();
    resetRateLimitStore();
  });

  it("allows requests up to the limit", () => {
    const r1 = checkRateLimit("1.2.3.4", OPTS);
    const r2 = checkRateLimit("1.2.3.4", OPTS);
    const r3 = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r1.allowed, true);
    assert.equal(r2.allowed, true);
    assert.equal(r3.allowed, true);
    assert.equal(r1.remaining, 2);
    assert.equal(r2.remaining, 1);
    assert.equal(r3.remaining, 0);
  });

  it("rejects the (limit+1)th request and returns ISO timestamp", () => {
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const r = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r.allowed, false);
    assert.equal(r.remaining, 0);
    assert.equal(r.retryAfterMs, OPTS.cooldownMs);
    assert.ok(r.limitedUntil != null);
    assert.match(
      r.limitedUntil!,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("isolates limits per IP", () => {
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const r = checkRateLimit("5.6.7.8", OPTS);
    assert.equal(r.allowed, true);
    assert.equal(r.remaining, OPTS.limit - 1);
  });

  it("keys unknown IP under 'unknown'", () => {
    const r1 = checkRateLimit(undefined, OPTS);
    const r2 = checkRateLimit(undefined, OPTS);
    const r3 = checkRateLimit(undefined, OPTS);
    const r4 = checkRateLimit(undefined, OPTS);
    assert.equal(r1.allowed, true);
    assert.equal(r4.allowed, false);
    const s = getRateLimitStore();
    assert.ok(s.entries.has("unknown"));
  });

  it("treats empty string IP as unknown", () => {
    checkRateLimit("", OPTS);
    assert.ok(getRateLimitStore().entries.has("unknown"));
  });

  it("cooldown short-circuits subsequent requests without re-running window math", () => {
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const reject = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(reject.allowed, false);

    // Same call again inside cooldown: should also reject.
    const reject2 = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(reject2.allowed, false);
    assert.ok(reject2.retryAfterMs > 0);
    assert.ok(reject2.retryAfterMs <= OPTS.cooldownMs);
  });

  it("retryAfterMs shrinks as time advances within cooldown", () => {
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const t0 = 1_000_000;
    setRateLimitNow(() => t0);
    const r0 = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r0.allowed, false);

    setRateLimitNow(() => t0 + 30_000);
    const r1 = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r1.allowed, false);
    assert.ok(r1.retryAfterMs < r0.retryAfterMs);
  });

  it("allows new requests once window has fully elapsed", () => {
    let t = 1_000_000;
    setRateLimitNow(() => t);

    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    assert.equal(checkRateLimit("1.2.3.4", OPTS).allowed, false);

    // Move past cooldown + window.
    t += OPTS.cooldownMs + OPTS.windowMs;
    setRateLimitNow(() => t);
    const r = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r.allowed, true);
  });

  it("does not extend blockedUntil for short-circuit rejects (sliding cooldown)", () => {
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const t = 1_000_000;
    setRateLimitNow(() => t);
    const r1 = checkRateLimit("1.2.3.4", OPTS);
    const firstUntil = new Date(t + OPTS.cooldownMs).toISOString();
    assert.equal(r1.limitedUntil, firstUntil);

    // Mid-cooldown reject must NOT extend the block.
    setRateLimitNow(() => t + 5_000);
    const r2 = checkRateLimit("1.2.3.4", OPTS);
    assert.equal(r2.allowed, false);
    assert.equal(r2.limitedUntil, firstUntil);

    // After cooldown, hitting the limit again resets blockedUntil to "now + cooldown".
    setRateLimitNow(() => t + OPTS.cooldownMs + 1);
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const r3 = checkRateLimit("1.2.3.4", OPTS);
    const thirdBase = t + OPTS.cooldownMs + 1;
    assert.equal(
      r3.limitedUntil,
      new Date(thirdBase + OPTS.cooldownMs).toISOString(),
    );
  });
});

describe("pruneRateLimitStore", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("removes entries with empty hits and expired blockedUntil", () => {
    let t = 1_000_000;
    setRateLimitNow(() => t);

    // Force one IP into a cooldown then clear its hits.
    for (let i = 0; i < OPTS.limit; i++) {
      checkRateLimit("1.2.3.4", OPTS);
    }
    const s = getRateLimitStore();
    const state = s.entries.get("1.2.3.4")!;
    state.hits = [];
    state.blockedUntil = t - 1;

    // Add a live entry that should survive.
    checkRateLimit("9.9.9.9", OPTS);

    pruneRateLimitStore(t);

    assert.ok(!s.entries.has("1.2.3.4"));
    assert.ok(s.entries.has("9.9.9.9"));
  });

  it("keeps entries with live hits", () => {
    let t = 1_000_000;
    setRateLimitNow(() => t);
    checkRateLimit("9.9.9.9", OPTS);
    pruneRateLimitStore(t);
    assert.ok(getRateLimitStore().entries.has("9.9.9.9"));
  });
});
