import { createError, defineEventHandler, getQuery, getRequestIP, setResponseHeader } from "h3";
import { checkRateLimit } from "../utils/rate-limit.ts";
import {
  defaultDbPath,
  isDbAvailable,
  queryDvfInBounds,
} from "../utils/dvf-db.ts";
import { parseDvfQuery } from "../utils/dvf-query.ts";

defineRouteMeta({
  openAPI: {
    description: "Returns DVF transaction points for the current map bounding box.",
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
        name: "limit",
        in: "query",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 5000, default: 2000 },
        description: "Maximum number of points to return.",
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
    ],
    responses: {
      200: {
        description:
          "DVF points, truncation flag, and price-per-m² statistics for the bounding box.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                points: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rowid: { type: "integer" },
                      id_mutation: { type: "string" },
                      date_mutation: { type: "string", format: "date" },
                      valeur_fonciere: { type: "string" },
                      type_local: { type: "string" },
                      surface_reelle_bati: { type: "number", nullable: true },
                      surface_terrain: { type: "number", nullable: true },
                      nombre_pieces_principales: {
                        type: "integer",
                        nullable: true,
                      },
                      code_postal: { type: "string" },
                      nom_commune: { type: "string" },
                      adresse_numero: { type: "string" },
                      adresse_suffixe: { type: "string" },
                      adresse_nom_voie: { type: "string" },
                      latitude: { type: "number" },
                      longitude: { type: "number" },
                    },
                  },
                },
                truncated: { type: "boolean" },
                stats: {
                  type: "object",
                  properties: {
                    medianPricePerSqm: { type: "number", nullable: true },
                    minPricePerSqm: { type: "number", nullable: true },
                    maxPricePerSqm: { type: "number", nullable: true },
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

  return queryDvfInBounds(bounds, filters);
});
