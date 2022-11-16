const { localTypes, years } = require("../constants");
const { getColor } = require("../drawer");

/**
 * @param {Record<string, import("../dvf").DvfStats>} stats
 * @return {import("chart.js").ChartDataset[]}
 */
function getCountDataSet(stats) {
  return localTypes.map((type, index) => ({
    label: type,
    data: Object.values(stats).map((row) => row.pricePerM2Median[type]),
    backgroundColor: getColor(index),
    borderColor: getColor(index),
  }));
}

/**
 * @param {{zipCode: string, data: Record<string, import("../dvf").DvfStats>}} stats
 * @return {import("chart.js").ChartConfiguration}
 */
function getConfiguration({ data, zipCode }) {
  return {
    type: "line",
    data: {
      datasets: getCountDataSet(data),
      // datasets: [
      //   {
      //     data: [20, 10],
      //     label: "69004",
      //   },
      // ],
      labels: years,
    },
    options: {},
    plugins: [],
  };
}

module.exports = { getConfiguration };
