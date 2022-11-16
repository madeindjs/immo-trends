const { Transform } = require("stream");

const { getZipCodeStream } = require("./zip-code");
const { getDvfStats } = require("./dvf");
const { drawImage } = require("./drawer");
const { years } = require("./constants");
const { getConfiguration } = require("./graphs/count-by-year");

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
  await drawImage(getConfiguration({ data, zipCode }), `${zipCode}-count-by-year`);
}

async function main() {
  const zipCodeStream = await getZipCodeStream();

  zipCodeStream.pipe(new ZipCodeStreamFilter()).on("data", (stats) => rowHandler(stats));
}

main().catch(console.error);
