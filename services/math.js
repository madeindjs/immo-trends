/**
 *
 * @param {number[]} numbers
 * @return {number}
 */
function median(numbers) {
  return [...numbers].sort()[Math.floor(numbers.length / 2)];
}

module.exports = { median };
