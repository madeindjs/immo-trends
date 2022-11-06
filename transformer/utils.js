/**
 * @param {string} date
 * @return {string}
 */
function transformDateFrToISO(date) {
  const [day, month, year] = date.split("/");

  return `${year}-${month}-${day}`;
}

module.exports = { transformDateFrToISO };
