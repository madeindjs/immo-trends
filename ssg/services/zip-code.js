const { parseCsvGzFromUrl, parseCsvFromUrl } = require("./fetcher");
const { Transform, Stream, Readable } = require("stream");

class ZipCodeFormater extends Transform {
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  _transform(chunk, encoding, next) {
    const zipCode = chunk["code postal"];
    const name = chunk["nom de la commune"];

    next(null, { zipCode, name });
  }
}

async function getZipCodeStream() {
  const stream = await parseCsvFromUrl("https://www.data.gouv.fr/fr/datasets/r/c3ba421c-6745-4fab-92ab-1716b16409c9", {
    delimiter: ";",
    from: 0,
    to: 1,
  });

  return stream.pipe(new ZipCodeFormater());
}

module.exports = { getZipCodeStream };
