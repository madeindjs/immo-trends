const { Transform } = require("stream");
const { stringify } = require("csv-stringify/sync");

const { getZipCodeStream } = require("./zip-code");
const { getDvfStats } = require("./dvf");
const { drawImage } = require("./drawer");
const { years } = require("./constants");
const { getConfiguration, convertConfigurationToArray } = require("./graph");
const { renderTemplate, renderHomeTemplate } = require("./template/renderer");
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
    const { zipCode, name } = chunk;

    Promise.all(years.map((year) => getDvfStats(year, chunk.zipCode)))
      .then((results) => {
        const data = results.reduce((acc, data, i) => {
          acc[years[i]] = data;
          return acc;
        }, {});
        next(null, { data, zipCode, name });
      })
      .catch((err) => next(err));
  }
}

/**
 * @param {{zipCode: string, name: string, data: Record<string, import("./dvf").DvfStats>}} stats
 */
async function rowHandler({ data, zipCode, name }) {
  const countConfiguration = getConfiguration(data, "count");
  await drawImage(countConfiguration, zipCode, `count`);
  const countData = convertConfigurationToArray(countConfiguration);
  await writeZipCodeFile(zipCode, "count.csv", stringify(countData, { columns: ["type", ...years], header: true }));

  const pricePerM2Configuration = getConfiguration(data, "pricePerM2Median");
  await drawImage(pricePerM2Configuration, zipCode, `median-price-by-surface`);
  const pricePerM2Data = convertConfigurationToArray(pricePerM2Configuration);
  await writeZipCodeFile(
    zipCode,
    "median-price-by-surface.csv",
    stringify(pricePerM2Data, { columns: ["type", ...years], header: true })
  );

  await renderTemplate("zip-code.ejs", { zipCode, pricePerM2Data, countData, years, name });
}

async function main() {
  let i = 0;
  let limit = 1;

  const zipCodeStream = await getZipCodeStream(limit);

  const zipCodes = [];

  zipCodeStream
    .pipe(new ZipCodeStreamFilter())
    .on("data", (stats) => {
      i++;
      console.log(`${i}/${limit}`);
      rowHandler(stats);

      zipCodes.push({ zipCode: stats.zipCode, name: stats.name });
    })
    .on("end", () => {
      renderHomeTemplate({ zipCodes });
    });
}

main().catch(console.error);
