/**
 * Per-IP sliding-window rate limiter with cooldown block.
 *
 * In-memory only. Single Node process. See docs/rate-limit.md.
 */

export type RateLimitOptions = {
  /** Max effective requests per window. */
  limit: number;
  /** Sliding window length, milliseconds. */
  windowMs: number;
  /** Cooldown block length after threshold crossed, milliseconds. */
  cooldownMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Remaining requests in the current window after this call (>= 0). */
  remaining: number;
  /** Milliseconds until the client may retry. 0 when allowed. */
  retryAfterMs: number;
  /** ISO timestamp at which the cooldown block lifts. Undefined when allowed. */
  limitedUntil: string | undefined;
  /** Effective count used by the sliding window (diagnostic). */
  effective: number;
};

type SlidingState = {
  hits: number[];
  blockedUntil: number | undefined;
};

type RateLimitStore = {
  entries: Map<string, SlidingState>;
};

let store: RateLimitStore | undefined;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function envEnabled(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") {
    return fallback;
  }
  return raw !== "0" && raw.toLowerCase() !== "false";
}

/**
 * Returns true if rate-limiting is enabled via env. Read once per call so
 * tests can toggle the env var without resetting the store.
 */
export function isRateLimitEnabled(): boolean {
  return envEnabled("RATE_LIMIT_ENABLED", true);
}

export function getRateLimitOptions(): RateLimitOptions {
  return {
    limit: envInt("RATE_LIMIT_LIMIT", 100),
    windowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),
    cooldownMs: envInt("RATE_LIMIT_COOLDOWN_MS", 600_000),
  };
}

/** Test clock injection. Falls back to wall clock. */
let nowFn: () => number = () => Date.now();

/** Replace the clock used for sliding-window math. Test-only. */
export function setRateLimitNow(fn: () => number): void {
  nowFn = fn;
}

/** Restore wall clock. Test-only. */
export function clearRateLimitNow(): void {
  nowFn = () => Date.now();
}

function getStore(): RateLimitStore {
  if (!store) {
    store = { entries: new Map() };
  }
  return store;
}

/** Returns the singleton store, creating it on first access. */
export function getRateLimitStore(): RateLimitStore {
  return getStore();
}

/**
 * Drop entries whose `hits` is empty AND whose `blockedUntil` has passed
 * (or is undefined). Bounded memory under churn.
 */
export function pruneRateLimitStore(now: number = nowFn()): void {
  const s = getStore();
  for (const [key, state] of s.entries) {
    const expired = state.hits.length === 0 &&
      (state.blockedUntil == null || state.blockedUntil <= now);
    if (expired) {
      s.entries.delete(key);
    }
  }
}

/** Clear all state. Test-only. */
export function resetRateLimitStore(): void {
  if (store) {
    store.entries.clear();
  } else {
    store = { entries: new Map() };
  }
}

/**
 * Weighted two-bucket sliding window. Boundary is `windowMs / 2`.
 * Returns the effective count (float). Does not mutate state.
 */
function effectiveCount(hits: number[], now: number, windowMs: number): number {
  const halfMs = windowMs / 2;
  const windowStart = now - windowMs;
  const halfStart = now - halfMs;

  // Drop expired.
  while (hits.length > 0 && hits[0]! < windowStart) {
    hits.shift();
  }
  if (hits.length === 0) {
    return 0;
  }

  // Partition into prior sub-window and current sub-window.
  let priorCount = 0;
  let firstCurrent = hits.length;
  for (let i = 0; i < hits.length; i++) {
    const t = hits[i]!;
    if (t < halfStart) {
      priorCount++;
    } else {
      firstCurrent = i;
      break;
    }
  }
  const currentCount = hits.length - firstCurrent;

  if (priorCount === 0) {
    return currentCount;
  }
  if (currentCount === 0) {
    return priorCount;
  }

  // Weighted: prior sub-window contributes the fraction still overlapping
  // the live window. Oldest prior hit determines overlap.
  const oldestPrior = hits[0]!;
  const overlapFraction = 1 - (now - oldestPrior) / windowMs;
  return priorCount * overlapFraction + currentCount;
}

const UNKNOWN_KEY = "unknown";

function bucketKey(ip: string | undefined): string {
  return ip == null || ip === "" ? UNKNOWN_KEY : ip;
}

/**
 * Check and record a hit for the given key. Returns the decision; caller
 * is responsible for rendering the response (headers, 429 body, etc).
 */
export function checkRateLimit(
  ip: string | undefined,
  options: RateLimitOptions = getRateLimitOptions(),
): RateLimitResult {
  if (!isRateLimitEnabled()) {
    return {
      allowed: true,
      remaining: options.limit,
      retryAfterMs: 0,
      limitedUntil: undefined,
      effective: 0,
    };
  }

  const key = bucketKey(ip);
  const now = nowFn();
  const s = getStore();
  let state = s.entries.get(key);

  // Cooldown short-circuit.
  if (state?.blockedUntil != null && state.blockedUntil > now) {
    const retryAfterMs = state.blockedUntil - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
      limitedUntil: new Date(state.blockedUntil).toISOString(),
      effective: options.limit,
    };
  }

  if (!state) {
    state = { hits: [], blockedUntil: undefined };
    s.entries.set(key, state);
  }

  const effective = effectiveCount(state.hits, now, options.windowMs);

  if (effective >= options.limit) {
    const blockedUntil = now + options.cooldownMs;
    state.blockedUntil = blockedUntil;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: options.cooldownMs,
      limitedUntil: new Date(blockedUntil).toISOString(),
      effective,
    };
  }

  state.hits.push(now);
  const remaining = Math.max(0, options.limit - Math.ceil(effective + 1));
  return {
    allowed: true,
    remaining,
    retryAfterMs: 0,
    limitedUntil: undefined,
    effective: effective + 1,
  };
}
