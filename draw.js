// @ts-check
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "immo-trends.db");
const graphsFolder = path.join(__dirname, "graphs");

// Create output directories if they don't exist
fs.mkdirSync(graphsFolder, { recursive: true });

const zipCodes = process.argv.slice(2).map(String);

const colors = ["#1abc9c", "#2980b9", "#c0392b", "#f39c12", "#9b59b6", "#2c3e50", "#7f8c8d", "#f1c40f"];

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

/**
 * Calculate median from an array of numbers
 * @param {number[]} array
 * @returns {number}
 */
function getMedian(array) {
  if (array.length === 0) return 0;
  array = array.slice(0).sort(function (x, y) {
    return x - y;
  });
  var b = (array.length + 1) / 2;
  return array.length % 2 ? array[b - 1] : (array[b - 1.5] + array[b - 0.5]) / 2;
}

async function drawGraph() {
  const db = new Database(dbPath);

  // Get available years from database
  const yearsResult = db.prepare(`SELECT DISTINCT year FROM transactions WHERE kind = 'Appartement' ORDER BY year ASC`).all();
  const years = yearsResult.map(row => row.year);

  if (years.length === 0) {
    console.error("No data found in database. Please run 'npm run import-data' first.");
    db.close();
    return;
  }

  if (zipCodes.length === 0) {
    console.error("Please specify zip codes as arguments, e.g.: node draw.js 69001 69002");
    db.close();
    return;
  }

  /** @type {import("chart.js").ChartDataset[]} */
  const datasets = [];

  const getPricesStmt = db.prepare(`
    SELECT price_per_sqm FROM transactions 
    WHERE zip_code = ? AND year = ? AND kind = 'Appartement'
  `);

  for (const [index, zipCode] of zipCodes.entries()) {
    // For each year, fetch all price_per_sqm values for this zip code
    const pricesByYear = {};
    
    for (const year of years) {
      const rows = getPricesStmt.all(zipCode, year);
      
      const prices = rows.map(row => row.price_per_sqm).filter(p => p != null && !isNaN(p));
      
      if (prices.length > 0) {
        pricesByYear[year] = {
          prices,
          median: getMedian(prices),
          average: prices.reduce((a, b) => a + b, 0) / prices.length,
          min: Math.min(...prices),
          max: Math.max(...prices),
          count: prices.length
        };
      }
    }

    // Build dataset using median values (same as original compute.js)
    const data = years.map(year => pricesByYear[year]?.median ?? null);
    
    datasets.push({
      data,
      label: zipCode,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length]
    });
  }

  db.close();

  /** @type {import("chart.js").ChartConfiguration} */
  const configuration = {
    type: "line",
    data: {
      datasets,
      labels: years,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Median Price per m² (€)'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Year'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price per m² (€)'
          }
        }
      }
    },
    plugins: [],
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(path.join(graphsFolder, `${zipCodes.join("-")}.png`), image);
}

drawGraph().catch(console.error);
