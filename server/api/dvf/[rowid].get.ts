import { createError, defineEventHandler, getRouterParam } from "h3";
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
