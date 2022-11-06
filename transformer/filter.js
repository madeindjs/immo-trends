const { Transform } = require("stream");

class Filter extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
    });
  }

  /**
   * @param {Dvp} chunk
   * @param {string} encoding
   * @param {Function} next
   * @returns
   */
  _transform(chunk, encoding, next) {
    if (!chunk.zipCode) {
      return next();
    }

    next(null, chunk);
  }
}
