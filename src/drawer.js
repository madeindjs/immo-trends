const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { writeZipCodeFile } = require("./file");

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, type: "svg" });

const colors = ["#1abc9c", "#2980b9", "#c0392b", "#f39c12", "#9b59b6", "#2c3e50", "#7f8c8d", "#f1c40f"];

/**
 *
 * @param {number} index
 * @return {string}
 */
function getColor(index) {
  return colors[index];
}

/**
 * @param {import("chart.js").ChartConfiguration} configuration
 * @param {string} name
 */
async function drawImage(configuration, zipCode, name) {
  const image = chartJSNodeCanvas.renderToBufferSync(configuration, "image/svg+xml");

  await writeZipCodeFile(zipCode, `${name}.svg`, image);
}

module.exports = { getColor, drawImage };












