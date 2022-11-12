// @ts-ignore
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sanitize = require("sanitize-filename");
const { parse } = require("csv-parse");
const { createGunzip } = require("zlib");
const os = require("os");
const path = require("path");
const fs = require("fs");
const fsP = require("fs/promises");
const { Transform } = require("stream");

const { Stream, Readable } = require("stream");

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
  const cachedFilename = path.join(os.tmpdir(), `geo-dvf-api-${sanitize(url)}.csv`);

  if (await fileExists(cachedFilename)) {
    return fs.createReadStream(cachedFilename).pipe(parse({ columns: true }));
  }

  const cacheStream = fs.createWriteStream(cachedFilename);

  const response = await fetch(url);
  if (!response.body) throw new Error("body not defined");

  response.body
    .pipe(createGunzip())
    .pipe(cacheStream)
    .on("end", () => cacheStream.destroy());

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
  const cachedFilename = path.join(os.tmpdir(), `geo-dvf-api-${getDvfForZipCodeStream.name}-${year}-${zipCode}.csv`);

  if (await fileExists(cachedFilename)) {
    const buff = await fsP.readFile(cachedFilename);
    const rowsStr = buff.toString("utf-8");

    return Readable.from(JSON.parse(rowsStr));
  }

  const dep = zipCode.substring(0, 2);
  const url = `https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/departements/${dep}.csv.gz`;
  const stream = (await parseCsvGzFromUrl(url)).pipe(new ZipCodeStreamFilter(zipCode));

  // cache

  const rows = [];

  stream
    .on("data", (row) => rows.push(row))
    .on("end", () => fs.writeFile(cachedFilename, JSON.stringify(rows), () => {}));

  return stream;
}

module.exports = { getDvfForZipCodeStream };
