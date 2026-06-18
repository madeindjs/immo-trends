/**
 * Boots the in-memory rate-limit store and a periodic prune tick.
 * Configured entirely via env (see docs/rate-limit.md).
 */

import { getRateLimitOptions, pruneRateLimitStore } from "../utils/rate-limit.ts";

export default defineNitroPlugin((nitroApp) => {
  const options = getRateLimitOptions();
  const pruneMs = (() => {
    const raw = process.env.RATE_LIMIT_PRUNE_MS;
    if (raw == null || raw === "") {
      return 60_000;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000;
  })();

  const interval = setInterval(() => {
    pruneRateLimitStore();
  }, pruneMs);
  // Don't keep the process alive solely for prune ticks.
  interval.unref?.();

  nitroApp.hooks.hook("close", () => {
    clearInterval(interval);
  });

  // Touch options so an unused-import warning never surfaces — the plugin
  // exists to install lifecycle hooks and the read confirms the env was
  // parsed successfully at boot.
  void options;
});
