const { getZipCodeStream } = require("./zip-code");

const { Transform, Stream, Readable } = require("stream");
const { getDvfStats } = require("./dvf");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const path = require("path");
const fs = require("fs");

class ZipCodeStreamFilter extends Transform {
  constructor() {
    super({ readableObjectMode: true, writableObjectMode: true });
  }

  /**
   *
   * @param {{zipCode: string, name: string}} chunk
   * @param {string} encoding
   * @param {Function} next
   */
  _transform(chunk, encoding, next) {
    const { zipCode } = chunk;

    Promise.all(years.map((year) => getDvfStats(year, chunk.zipCode)))
      .then((results) => {
        const data = results.reduce((acc, data, i) => {
          acc[years[i]] = data;
          return acc;
        }, {});
        next(null, { data, zipCode });
      })
      .catch((err) => next(err));
  }
}

const years = ["2017", "2018", "2019", "2020"];
const localTypes = ["Appartement", "Dépendance", "Local industriel. commercial ou assimilé"];

const colors = ["#1abc9c", "#2980b9", "#c0392b", "#f39c12", "#9b59b6", "#2c3e50", "#7f8c8d", "#f1c40f"];

/**
 * @param {Record<string, import("./dvf").DvfStats>} stats
 * @return {import("chart.js").ChartDataset[]}
 */
function getCountDataSet(stats) {
  return localTypes.map((type, index) => ({
    label: type,
    data: Object.values(stats).map((row) => row.count[type]),
    backgroundColor: colors[index],
    borderColor: colors[index],
  }));
}

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

/**
 * @param {{zipCode: string, data: Record<string, import("./dvf").DvfStats>}} stats
 */
async function rowHandler({ data, zipCode }) {
  // console.log("rowHandler", stats);

  /** @type {import("chart.js").ChartConfiguration} */
  const configuration = {
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

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(path.join(__dirname, `${zipCode}.png`), image);
}

async function main() {
  const zipCodeStream = await getZipCodeStream();

  zipCodeStream.pipe(new ZipCodeStreamFilter()).on("data", (stats) => rowHandler(stats));
}

main().catch(console.error);
