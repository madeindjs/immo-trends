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

/**
 * @param {string | number} year
 * @param {string} zipCode
 */
async function getDvfStats(year, zipCode) {
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
  const rowHandler = (row) => {
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

    surfaces[kind] ??= [];
    surfaces[kind].push(surface);

    if (surface && price) {
      const pricePerM2 = price / surface;

      pricesPerM2[kind] ??= [];
      pricesPerM2[kind].push(pricePerM2);

      result.usedCount[kind] ??= 0;
      result.usedCount[kind]++;
    }

    result.count[kind] ??= 0;
    result.count[kind]++;
  };

  return new Promise((resolve, reject) => {
    stream
      .on("data", (row) => rowHandler(row))
      .on("error", (error) => reject(error))
      .on("end", () => {
        result.pricePerM2Median = Object.entries(pricesPerM2).reduce((acc, [kind, prices]) => {
          acc[kind] = Math.floor(median(prices));
          return acc;
        }, {});

        result.towns = Array.from(towns);

        resolve(result);
      });
  });
}

module.exports = { getDvfStats };
