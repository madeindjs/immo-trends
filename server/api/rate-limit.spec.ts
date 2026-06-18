import assert from "node:assert/strict";
import { createApp, createRouter, defineEventHandler, toNodeListener } from "h3";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createServer, type Server } from "node:http";
import {
  checkRateLimit,
  clearRateLimitNow,
  resetRateLimitStore,
  setRateLimitNow,
} from "../utils/rate-limit.ts";

/**
 * HTTP-level smoke for the rate-limit wrapping pattern. Builds an h3 app
 * that mirrors the production handler's check-then-throw flow, so we can
 * assert end-to-end headers + body shape without booting Nitro.
 */

function buildApp() {
  const app = createApp();
  const router = createRouter();

  const handler = defineEventHandler((event) => {
    const decision = checkRateLimit("203.0.113.7");
    if (!decision.allowed) {
      event.node.res.setHeader(
        "Retry-After",
        String(Math.ceil(decision.retryAfterMs / 1000)),
      );
      event.node.res.statusCode = 429;
      event.node.res.setHeader("Content-Type", "application/json");
      event.node.res.end(
        JSON.stringify({
          statusCode: 429,
          statusMessage: "Too Many Requests",
          data: {
            message: `Rate limited until ${decision.limitedUntil}`,
            limitedUntil: decision.limitedUntil,
            retryAfter: Math.ceil(decision.retryAfterMs / 1000),
          },
        }),
      );
      return;
    }
    return { ok: true };
  });

  router.get("/api/dvf", handler);
  app.use(router);
  return app;
}

function startServer(app: ReturnType<typeof buildApp>): Promise<{
  server: Server;
  url: string;
}> {
  return new Promise((resolve) => {
    const server = createServer(toNodeListener(app));
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({ server, url: `http://127.0.0.1:${addr.port}` });
      }
    });
  });
}

function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

describe("rate-limit HTTP wrapping", () => {
  let server: Server;
  let url: string;

  beforeEach(async () => {
    resetRateLimitStore();
    setRateLimitNow(() => 1_000_000);
    const booted = await startServer(buildApp());
    server = booted.server;
    url = booted.url;
  });

  afterEach(async () => {
    await stopServer(server);
    clearRateLimitNow();
    resetRateLimitStore();
  });

  it("returns 200 with no rate-limit headers on success", async () => {
    const res = await fetch(`${url}/api/dvf`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("retry-after"), null);
    const body = await res.json();
    assert.deepEqual(body, { ok: true });
  });

  it("returns 429 with Retry-After and ISO timestamp in body after limit+1", async () => {
    // limit defaults to 100, so send 100 OKs + 1 rejected.
    for (let i = 0; i < 100; i++) {
      const r = await fetch(`${url}/api/dvf`);
      assert.equal(r.status, 200, `request ${i + 1} should be 200`);
    }
    const r = await fetch(`${url}/api/dvf`);
    assert.equal(r.status, 429);
    const retryAfter = r.headers.get("retry-after");
    assert.ok(retryAfter != null);
    assert.ok(Number.parseInt(retryAfter, 10) > 0);
    const body = await r.json();
    assert.equal(body.statusCode, 429);
    assert.equal(body.statusMessage, "Too Many Requests");
    assert.match(
      body.data.message,
      /^Rate limited until \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    assert.ok(typeof body.data.limitedUntil === "string");
    assert.equal(typeof body.data.retryAfter, "number");
  });

  it("every subsequent request inside cooldown returns 429", async () => {
    for (let i = 0; i < 100; i++) {
      await fetch(`${url}/api/dvf`);
    }
    const a = await fetch(`${url}/api/dvf`);
    const b = await fetch(`${url}/api/dvf`);
    assert.equal(a.status, 429);
    assert.equal(b.status, 429);
  });
});
