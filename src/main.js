const { Transform } = require("stream");
const { stringify } = require("csv-stringify/sync");

const { getZipCodeStream } = require("./zip-code");
const { getDvfStats } = require("./dvf");
const { drawImage } = require("./drawer");
const { years } = require("./constants");
const { getConfiguration, convertConfigurationToArray } = require("./graph");
const { renderTemplate } = require("./template/renderer");
const { writeZipCodeFile } = require("./file");

class ZipCodeStreamFilter extends Transform {
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  /**
   *
   * @param {{zipCode: string, name: string}} chunk
   * @param {string} encoding
   * @param {Function} next
   */
  _transform(chunk, encoding, next) {
    const { zipCode } = chunk;

    Promise.all(years.map((year) => getDvfStats(year, chunk.zipCode)))
      .then((results) => {
        const data = results.reduce((acc, data, i) => {
          acc[years[i]] = data;
          return acc;
        }, {});
        next(null, { data, zipCode });
      })
      .catch((err) => next(err));
  }
}

/**
 * @param {{zipCode: string, data: Record<string, import("./dvf").DvfStats>}} stats
 */
async function rowHandler({ data, zipCode }) {
  const countConfiguration = getConfiguration({ data, zipCode }, "count");
  await drawImage(countConfiguration, zipCode, `count`);
  const countData = convertConfigurationToArray(countConfiguration);
  await writeZipCodeFile(zipCode, "count.csv", stringify(countData, { columns: ["type", ...years], header: true }));

  const pricePerM2Configuration = getConfiguration({ data, zipCode }, "pricePerM2Median");
  await drawImage(pricePerM2Configuration, zipCode, `median-price-by-surface`);
  const pricePerM2Data = convertConfigurationToArray(pricePerM2Configuration);
  await writeZipCodeFile(
    zipCode,
    "median-price-by-surface.csv",
    stringify(pricePerM2Data, { columns: ["type", ...years], header: true })
  );

  await renderTemplate("zip-code.ejs", { zipCode, pricePerM2Data, countData, years });
}

async function main() {
  let i = 0;
  let limit = 1;

  const zipCodeStream = await getZipCodeStream(limit);

  zipCodeStream.pipe(new ZipCodeStreamFilter()).on("data", (stats) => {
    i++;
    console.log(`${i}/${limit}`);
    rowHandler(stats);
  });
}

main().catch(console.error);































