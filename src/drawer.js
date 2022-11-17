const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const path = require("path");
const fs = require("fs/promises");

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour, type: "svg" });

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
async function drawImage(configuration, folder, name) {
  const image = chartJSNodeCanvas.renderToBufferSync(configuration, "image/svg+xml");

  fs.mkdir(path.join(__dirname, "..", "dist", folder)).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });

  await fs.writeFile(path.join(__dirname, "..", "dist", folder, `${name}.svg`), image);
}

module.exports = { getColor, drawImage };





