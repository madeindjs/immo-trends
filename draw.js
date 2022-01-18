// @ts-check
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const fs = require("fs");
const path = require("path");

const computesFolder = path.join(__dirname, "computes");

const year = fs.readdirSync(computesFolder).map((file) => Number(file.split(".")[0]));

const zipCodes = process.argv.slice(2).map(Number);

const colors = ["#1abc9c", "#2980b9", "#c0392b", "#f39c12", "#9b59b6", "#2c3e50", "#7f8c8d", "#f1c40f"];

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

async function drawGraph() {
  /** @type {import("chart.js").ChartDataset[]} */
  const datasets = zipCodes.map((zipCode, index) => {
    const data = year.map((year) => require(path.join(computesFolder, `${year}.json`))[zipCode]);

    return { data, label: zipCode, backgroundColor: colors[index], borderColor: colors[index] };
  });

  // console.log(datasets);

  /** @type {import("chart.js").ChartConfiguration} */
  const configuration = {
    type: "line",
    data: {
      datasets,
      // datasets: [
      //   {
      //     data: [20, 10],
      //     label: "69004",
      //   },
      // ],
      labels: year,
    },
    options: {},
    plugins: [],
  };
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  // const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
  // const stream = chartJSNodeCanvas.renderToStream(configuration);
  fs.writeFileSync(path.join(__dirname, "graphs", `${zipCodes.join("-")}.png`), image);
  // console.log(dataUrl);
}
drawGraph();
