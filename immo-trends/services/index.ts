import { CSVRow, YearStat } from "../models";

const { getSurface } = require("./record");
const { median } = require("./math");
const { getDvfForZipCodeStream } = require("./fetcher");

/**
 * @typedef Data
 * @property {Record<string, number>} count
 * @property {Record<string, number>} usedCount
 * @property {Record<string, number>} pricePerM2Median
 * @property {string[]} towns
 * @property {Date} lastMutationDate
 * @property {Date} firstMutationDate
 */

export async function getDvfStats(year: string | number, zipCode: string): Promise<YearStat> {
  const stream = await getDvfForZipCodeStream(year, zipCode);

  /** @type {Data} */
  const result = {
    count: {},
    usedCount: {},
    pricePerM2Median: {},
    towns: [],
    lastMutationDate: new Date("1970-01-01"),
    firstMutationDate: new Date(),
  };

  /** @type {Record<string, number[]>} */
  const surfaces = {};
  /** @type {Record<string, number[]>} */
  const pricesPerM2 = {};

  const towns = new Set();

  /**
   * @param {import("./record").CSVRow} row
   */
  const rowHandler = (row: any) => {
    const kind = row.type_local;
    const price = Number(row.valeur_fonciere);

    const mutationDate = new Date(row.date_mutation);

    if (mutationDate.getTime() > result.lastMutationDate.getTime()) {
      result.lastMutationDate = mutationDate;
    }

    if (mutationDate.getTime() < result.firstMutationDate.getTime()) {
      result.firstMutationDate = mutationDate;
    }

    towns.add(row.nom_commune);

    const surface = getSurface(row);

    // @ts-ignore
    surfaces[kind] ??= [];
    // @ts-ignore
    surfaces[kind].push(surface);

    if (surface && price) {
      const pricePerM2 = price / surface;

      // @ts-ignore
      pricesPerM2[kind] ??= [];
      // @ts-ignore
      pricesPerM2[kind].push(pricePerM2);

      // @ts-ignore
      result.usedCount[kind] ??= 0;
      // @ts-ignore
      result.usedCount[kind]++;
    }

    // @ts-ignore
    result.count[kind] ??= 0;
    // @ts-ignore
    result.count[kind]++;
  };

  return new Promise((resolve, reject) => {
    stream
      .on("data", (row: CSVRow) => rowHandler(row))
      .on("error", (error: any) => reject(error))
      .on("end", () => {
        result.pricePerM2Median = Object.entries(pricesPerM2).reduce((acc, [kind, prices]) => {
          // @ts-ignore
          acc[kind] = Math.floor(median(prices));
          return acc;
        }, {});

        // @ts-ignore
        result.towns = Array.from(towns);

        // @ts-ignore
        resolve(result);
      });
  });
}
