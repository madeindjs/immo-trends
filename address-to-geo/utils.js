/**
 *
 * @param {string} zipCode
 * @returns {string}
 */
function completeZipCode(zipCode) {
  while (zipCode.length < 5) {
    zipCode = `0${zipCode}`;
  }

  return zipCode;
}

module.exports = { completeZipCode };
