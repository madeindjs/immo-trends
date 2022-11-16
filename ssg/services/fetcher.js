// @ts-ignore
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sanitize = require("sanitize-filename");
const { parse } = require("csv-parse");
const { createGunzip } = require("zlib");
const os = require("os");
const path = require("path");
const fs = require("fs");

const { fileExists } = require("./file");

/**
 * @param {string} url
 * @param {import('csv-parse').Options} parserOpts
 * @returns
 */
async function parseCsvFromUrl(url, parserOpts = {}) {
  const cachedFilename = path.join(os.tmpdir(), `geo-dvf-api-${sanitize(url)}.csv`);

  const parser = parse({ columns: true, ...parserOpts });

  if (await fileExists(cachedFilename)) {
    return fs.createReadStream(cachedFilename).pipe(parser);
  }

  const cacheStream = fs.createWriteStream(cachedFilename);

  const response = await fetch(url);
  if (!response.body) throw new Error("body not defined");

  response.body.pipe(cacheStream).on("end", () => cacheStream.destroy());

  return response.body.pipe(parser);
}

/**
 * @param {string} url
 * @param {import('csv-parse').Options} parserOpts
 * @returns
 */
async function parseCsvGzFromUrl(url, parserOpts = {}) {
  const cachedFilename = path.join(os.tmpdir(), `geo-dvf-api-${sanitize(url)}.csv`);

  const parser = parse({ columns: true, ...parserOpts });

  if (await fileExists(cachedFilename)) {
    return fs.createReadStream(cachedFilename).pipe(parser);
  }

  const cacheStream = fs.createWriteStream(cachedFilename);

  const response = await fetch(url);
  if (!response.body) throw new Error("body not defined");

  response.body
    .pipe(createGunzip())
    .pipe(cacheStream)
    .on("end", () => cacheStream.destroy());

  return response.body.pipe(createGunzip()).pipe(parser);
}

module.exports = { parseCsvGzFromUrl, parseCsvFromUrl };
