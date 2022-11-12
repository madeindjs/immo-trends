// @ts-ignore
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sanitize = require("sanitize-filename");
const { parse } = require("csv-parse");
const { createGunzip } = require("zlib");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { Transform } = require("stream");

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

async function getDvfForZipCodeStream(year, zipCode) {
  const dep = zipCode.substring(0, 2);
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/departements/${dep}.csv.gz`;

  return (await parseCsvGzFromUrl(url)).pipe(new ZipCodeStreamFilter(zipCode));
}

module.exports = { getDvfForZipCodeStream };
