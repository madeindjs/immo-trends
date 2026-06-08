import { createError, defineEventHandler, getQuery } from "h3";
import {
  defaultDbPath,
  isIrisDbAvailable,
  queryIrisInBounds,
} from "../utils/iris-db.ts";
import { parseIrisQuery } from "../utils/iris-query.ts";

export default defineEventHandler((event) => {
  if (!isIrisDbAvailable(defaultDbPath)) {
    throw createError({
      statusCode: 503,
      statusMessage:
        "IRIS data not found. Run ./init.sh to download and import data.",
    });
  }

  let bounds;
  let limit;

  try {
    ({ bounds, limit } = parseIrisQuery(getQuery(event)));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid query parameters";
    throw createError({
      statusCode: 400,
      statusMessage: message,
    });
  }

  return queryIrisInBounds(bounds, limit);
});
