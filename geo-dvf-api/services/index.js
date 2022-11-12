const { getSurface } = require("./record");
const { median } = require("./math");
const { getDvfForZipCodeStream } = require("./fetcher");

/**
 * @typedef Data
 * @property {Record<string, number>} count
 * @property {Record<string, number>} usedCount
 * @property {Record<string, number>} pricePerM2Median
 */

/**
 * @param {string | number} year
 * @param {string} zipCode
 */
async function getDvfStats(year, zipCode) {
  const stream = await getDvfForZipCodeStream(year, zipCode);

  /** @type {Data} */
  const result = { count: {}, usedCount: {}, pricePerM2Median: {} };

  /** @type {Record<string, number[]>} */
  const surfaces = {};
  /** @type {Record<string, number[]>} */
  const pricesPerM2 = {};

  return new Promise((resolve, reject) => {
    stream
      .on("data", (row) => {
        const kind = row["type_local"];
        const price = Number(row["valeur_fonciere"]);

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
      })
      .on("error", (error) => reject(error))
      .on("end", () => {
        result.pricePerM2Median = Object.entries(pricesPerM2).reduce((acc, [kind, prices]) => {
          acc[kind] = median(prices);
          return acc;
        }, {});

        resolve(result);
      });
  });
}

module.exports = { getDvfStats };
