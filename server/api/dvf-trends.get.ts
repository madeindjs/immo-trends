import { createError, defineEventHandler, getQuery, getRequestIP, setResponseHeader } from "h3";
import { checkRateLimit } from "../utils/rate-limit.ts";
import {
  defaultDbPath,
  isDbAvailable,
  queryDvfPriceTrends,
} from "../utils/dvf-db.ts";
import { parseDvfTrendsQuery } from "../utils/dvf-query.ts";

defineRouteMeta({
  openAPI: {
    description: "Returns price-per-m² trends for the current map bounding box.",
    tags: ["DVF"],
    parameters: [
      {
        name: "north",
        in: "query",
        required: true,
        schema: { type: "number" },
        description: "Northern latitude bound (WGS-84).",
      },
      {
        name: "south",
        in: "query",
        required: true,
        schema: { type: "number" },
        description: "Southern latitude bound (WGS-84).",
      },
      {
        name: "east",
        in: "query",
        required: true,
        schema: { type: "number" },
        description: "Eastern longitude bound (WGS-84).",
      },
      {
        name: "west",
        in: "query",
        required: true,
        schema: { type: "number" },
        description: "Western longitude bound (WGS-84).",
      },
      {
        name: "type_local",
        in: "query",
        required: false,
        schema: { type: "string" },
        description:
          "Filter by property type. Repeat or comma-separate values, e.g. Maison, Appartement.",
      },
      {
        name: "year",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "Filter by mutation year (YYYY). Sets both year_min and year_max.",
      },
      {
        name: "year_min",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "Earliest mutation year (YYYY).",
      },
      {
        name: "year_max",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "Latest mutation year (YYYY).",
      },
      {
        name: "surface_min",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Minimum built surface in m² (surface_reelle_bati).",
      },
      {
        name: "surface_max",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Maximum built surface in m² (surface_reelle_bati).",
      },
      {
        name: "surface_terrain_min",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Minimum land surface in m² (surface_terrain).",
      },
      {
        name: "surface_terrain_max",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Maximum land surface in m² (surface_terrain).",
      },
      {
        name: "price_per_sqm_min",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Minimum price per m² in € (valeur_fonciere / surface_reelle_bati).",
      },
      {
        name: "price_per_sqm_max",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Maximum price per m² in € (valeur_fonciere / surface_reelle_bati).",
      },
      {
        name: "rooms_min",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Minimum number of main rooms (nombre_pieces_principales).",
      },
      {
        name: "rooms_max",
        in: "query",
        required: false,
        schema: { type: "number", minimum: 0 },
        description: "Maximum number of main rooms (nombre_pieces_principales).",
      },
      {
        name: "group_by",
        in: "query",
        required: false,
        schema: { type: "string", enum: ["month", "quarter", "year"], default: "month" },
        description: "Grouping period: month (default), quarter, or year.",
      },
    ],
    responses: {
      200: {
        description: "Price-per-m² trend points for the bounding box.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                trends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: {
                        type: "string",
                        description:
                          "Period key: YYYY-MM, YYYY-Qn, or YYYY depending on group_by.",
                      },
                      medianPricePerSqm: { type: "number", nullable: true },
                      count: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Missing or invalid query parameters.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                statusCode: { type: "integer" },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      429: {
        description: "Rate limit exceeded.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                statusCode: { type: "integer" },
                statusMessage: { type: "string" },
                message: { type: "string" },
                data: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    limitedUntil: { type: "string" },
                    retryAfter: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      503: {
        description: "DVF database is missing.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                statusCode: { type: "integer" },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

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
