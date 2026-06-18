import { createError, defineEventHandler, getRequestIP, getRouterParam, setResponseHeader } from "h3";
import { checkRateLimit } from "../../utils/rate-limit.ts";
import {
  defaultDbPath,
  isDbAvailable,
  queryDvfByRowid,
} from "../../utils/dvf-db.ts";

function parseRowid(value: string | undefined): number {
  if (value == null || value.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing rowid",
    });
  }

  const rowid = Number(value);
  if (!Number.isInteger(rowid) || rowid <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid rowid",
    });
  }

  return rowid;
}

export default defineEventHandler((event) => {
  const decision = checkRateLimit(getRequestIP(event) ?? undefined);
  if (!decision.allowed) {
    setResponseHeader(event, "Retry-After", Math.ceil(decision.retryAfterMs / 1000));
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      data: {
        message: `Rate limited until ${decision.limitedUntil}`,
        limitedUntil: decision.limitedUntil,
        retryAfter: Math.ceil(decision.retryAfterMs / 1000),
      },
    });
  }

  if (!isDbAvailable(defaultDbPath)) {
    throw createError({
      statusCode: 503,
      statusMessage:
        "DVF database not found. Run ./init.sh to download and import data.",
    });
  }

  const rowid = parseRowid(getRouterParam(event, "rowid"));
  const row = queryDvfByRowid(rowid);

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: "DVF row not found",
    });
  }

  return row;
});
