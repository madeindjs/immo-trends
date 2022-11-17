const { localTypes, years } = require("./constants");
const { getColor } = require("./drawer");

/**
 * @param {Record<string, import("./dvf").DvfStats>} stats
 * @param {string} key
 * @return {import("chart.js").ChartDataset[]}
 */
function getCountDataSet(stats, key) {
  return localTypes.map((type, index) => ({
    label: type,
    data: Object.values(stats).map((row) => row[key][type]),
    backgroundColor: getColor(index),
    borderColor: getColor(index),
  }));
}

/**
 * @param {{zipCode: string, data: Record<string, import("./dvf").DvfStats>}} stats
 * @param {string} key
 * @return {import("chart.js").ChartConfiguration}
 */
function getConfiguration({ data, zipCode }, key) {
  return {
    type: "line",
    data: {
      datasets: getCountDataSet(data, key),
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

/**
 * @param {import("chart.js").ChartConfiguration} configuration
 */
function convertConfigurationToArray(configuration) {
  return configuration.data?.datasets?.map((series) => [series.label, ...(series.data ?? [])]) ?? [];
}

module.exports = { getConfiguration, convertConfigurationToArray };

