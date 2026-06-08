import { createError, defineEventHandler, getQuery } from "h3";
import {
  defaultDbPath,
  isDbAvailable,
  queryDvfPriceTrends,
} from "../utils/dvf-db.ts";
import { parseDvfQuery } from "../utils/dvf-query.ts";

export default defineEventHandler((event) => {
  if (!isDbAvailable(defaultDbPath)) {
    throw createError({
      statusCode: 503,
      statusMessage:
        "DVF database not found. Run ./init.sh to download and import data.",
    });
  }

  let bounds;
  let filters;

  try {
    ({ bounds, filters } = parseDvfQuery(getQuery(event)));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid query parameters";
    throw createError({
      statusCode: 400,
      statusMessage: message,
    });
  }

  return {
    trends: queryDvfPriceTrends(bounds, filters),
  };
});
