const { Transform } = require("stream");

const { getZipCodeStream } = require("./zip-code");
const { getDvfStats } = require("./dvf");
const { drawImage } = require("./drawer");
const { years } = require("./constants");
const { getConfiguration: getCountByYearConfiguration } = require("./graphs/count-by-year");
const { getConfiguration: getMedianByYearConfiguration } = require("./graphs/median-price-by-surface");

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
  await drawImage(getCountByYearConfiguration({ data, zipCode }), zipCode, `count`);
  await drawImage(getMedianByYearConfiguration({ data, zipCode }), zipCode, `median-price-by-surface`);
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



