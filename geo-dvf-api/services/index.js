// @ts-ignore
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sanitize = require("sanitize-filename");

const { parse } = require("csv-parse");
const { Transform } = require("stream");
const { createGunzip } = require("zlib");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { getSurface } = require("./record");
const { median } = require("./math");

function fileExists(filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err) => {
      if (err == null) {
        resolve(true);
      } else if (err.code === "ENOENT") {
        resolve(false);
      } else {
        reject(err.code);
      }
    });
  });
}

async function parseCsvGzFromUrl(url) {
  const cachedFilename = path.join(os.tmpdir(), `geo-dvf-api-${sanitize(url)}`);

  if (await fileExists(cachedFilename)) {
    return fs
      .createReadStream(cachedFilename)
      .pipe(createGunzip())
      .pipe(parse({ columns: true }));
  }

  const cacheStream = fs.createWriteStream(cachedFilename);

  const response = await fetch(url);
  if (!response.body) throw new Error("body not defined");

  response.body.pipe(cacheStream).on("end", () => cacheStream.destroy());

  return response.body.pipe(createGunzip()).pipe(parse({ columns: true }));
}

class ZipCodeStreamFilter extends Transform {
  zipCode;

  /**
   * @param {string} zipCode
   */
  constructor(zipCode) {
    super({ readableObjectMode: true, writableObjectMode: true });
    this.zipCode = zipCode;
  }

  _transform(chunk, encoding, next) {
    if (chunk["code_postal"] === this.zipCode) {
      return next(null, chunk);
    }

    next();
  }
}

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
async function getData(year, zipCode) {
  const dep = zipCode.substring(0, 2);
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/departements/${dep}.csv.gz`;

  const stream = (await parseCsvGzFromUrl(url)).pipe(new ZipCodeStreamFilter(zipCode));

  /** @type {Data} */
  const result = { count: {}, usedCount: {}, pricePerM2Median: {} };

  /** @type {Record<string, number[]>} */
  const surfaces = {};
  /** @type {Record<string, number[]>} */
  const pricesPerM2 = {};

  return new Promise((resolve, reject) => {
    stream

      .on("data", (row) => {
        // console.log(row);
        const kind = row["type_local"];
        const price = Number(row["valeur_fonciere"]);

        const surface = getSurface(row);

        surfaces[kind] ??= [];
        surfaces[kind].push(surface);

        if (surface && price) {
          const pricePerM2 = price / surface;
          // console.log("surface", { surface, price });
          // if (! pricesPerM2[kind])

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

module.exports = { getData };
