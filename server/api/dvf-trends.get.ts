import { createError, defineEventHandler, getQuery, getRequestIP, setResponseHeader } from "h3";
import { checkRateLimit } from "../utils/rate-limit.ts";
import {
  defaultDbPath,
  isDbAvailable,
  queryDvfPriceTrends,
} from "../utils/dvf-db.ts";
import { parseDvfTrendsQuery } from "../utils/dvf-query.ts";

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

  let bounds;
  let filters;
  let groupBy;

  try {
    ({ bounds, filters, groupBy } = parseDvfTrendsQuery(getQuery(event)));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid query parameters";
    throw createError({
      statusCode: 400,
      statusMessage: message,
    });
  }

  return {
    trends: queryDvfPriceTrends(bounds, filters, defaultDbPath, groupBy),
  };
});
