# Rate limiting

Public `/api/dvf*` endpoints are throttled per client IP to protect the
SQLite-backed map service from abusive scrapers. Implementation is
in-memory (single Node process), with no external dependencies.

## Algorithm

- **Sliding window** (Cloudflare-style weighted two-bucket). Boundary is
  `windowMs / 2`. Bursts at the window edge are smoothed, unlike a
  fixed-window counter.
- **Cooldown block** — once a client exceeds the effective limit, they
  are rejected for `cooldownMs` (10 minutes by default). Requests inside
  the cooldown short-circuit without re-running window math. The block
  is not extended by continued probes: each new violation past the
  cooldown resets the timer.

## Configuration (environment variables)

| Variable | Default | Meaning |
|---|---|---|
| `RATE_LIMIT_ENABLED` | `1` | Set to `0` to disable rate limiting entirely. |
| `RATE_LIMIT_LIMIT` | `100` | Effective requests allowed per window. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Sliding window length, in milliseconds. |
| `RATE_LIMIT_COOLDOWN_MS` | `600000` | Cooldown block length, in milliseconds. |
| `RATE_LIMIT_PRUNE_MS` | `60000` | How often the in-memory store is garbage-collected. |

Defaults are tuned for the map UI: an active mapper firing pan/zoom
requests stays comfortably under `100 / min`, while a scraper that
ignores the 429 is blocked for 10 minutes.

## Client identity

`getRequestIP(event)` from h3 is used as the bucket key. When the IP
cannot be determined, the request is bucketed under the literal key
`"unknown"` (probes share a quota). There is no `X-Forwarded-For`
trust today; add a `TRUST_PROXY` flag if a reverse proxy is introduced
in front of the container.

## Response shape

When the limit is exceeded, every endpoint returns:

- Status: `429 Too Many Requests`
- Header: `Retry-After: <seconds>` (integer, per RFC 9110 §10.2.3)
- Body (JSON):
  ```json
  {
    "statusCode": 429,
    "statusMessage": "Too Many Requests",
    "data": {
      "message": "Rate limited until 2026-06-17T18:42:13.000Z",
      "limitedUntil": "2026-06-17T18:42:13.000Z",
      "retryAfter": 600
    }
  }
  ```

`limitedUntil` is the ISO-8601 timestamp at which the cooldown lifts.
No other `X-RateLimit-*` informational headers are sent.

## Scope and limitations

- **Single process only.** The store is an in-process `Map`. Running
  multiple replicas will let a client multiply their effective quota
  by the replica count. Swap to a shared store (Redis, Nitro
  `unstorage` driver) before scaling out.
- **Ephemeral.** All state is lost on process restart. The block list
  is intentionally non-persistent.
- **No API keys / tiers.** All clients share the same limit.

## Rollback

Set `RATE_LIMIT_ENABLED=0` in the deploy environment. No rebuild
required.
