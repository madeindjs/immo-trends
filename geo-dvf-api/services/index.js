// @ts-ignore
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { count } = require("console");
const { parse } = require("csv-parse");
const { Transform } = require("stream");
const { createGunzip } = require("zlib");

async function parseCsvGzFromUrl(url) {
  // TODO: add cache mechanism
  const response = await fetch(url);
  if (!response.body) throw new Error("body not defined");
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
 * @property {number} count
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
  const result = { count: 0 };

  return new Promise((resolve, reject) => {
    stream
      .on("data", (row) => {
        result.count++;
      })
      .on("error", (error) => reject(error))
      .on("end", () => resolve(result));
  });
}

module.exports = { getData };
