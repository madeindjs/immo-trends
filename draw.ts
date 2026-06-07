import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DvfRow } from "./types.ts";
import { getMedian, getPriceStats, calculatePricePerSqm } from "./draw.utils.ts";

const dbPath = path.join(import.meta.dirname, "dvf.sqlite3");
const graphsFolder = path.join(import.meta.dirname, "graphs");

// Create output directories if they don't exist
fs.mkdirSync(graphsFolder, { recursive: true });

const zipCodes: string[] = process.argv.slice(2).map(String);

const colors = [
  "#1abc9c",
  "#2980b9",
  "#c0392b",
  "#f39c12",
  "#9b59b6",
  "#2c3e50",
  "#7f8c8d",
  "#f1c40f",
];

const width = 600; //px
const height = 600; //px
const backgroundColour = "white"; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width,
  height,
  backgroundColour,
});

// Type for rows returned by the price query
type PriceRow = Pick<DvfRow, "valeur_fonciere" | "surface_reelle_bati">;

async function drawGraph(): Promise<void> {
  const db = new DatabaseSync(dbPath);

  // Get available years from database
  const yearsStmt = db.prepare(
    `SELECT DISTINCT strftime('%Y', date_mutation) as year FROM dvf ORDER BY year ASC`,
  );
  const yearsResult = yearsStmt.all() as Array<{ year: string }>;
  const years: number[] = yearsResult.map((row) => parseInt(row.year, 10));

  if (years.length === 0) {
    console.error(
      "No data found in database. Please run 'npm run import-data' first.",
    );
    db.close();
    return;
  }

  if (zipCodes.length === 0) {
    console.error(
      "Please specify zip codes as arguments, e.g.: node draw.ts 69001 69002",
    );
    db.close();
    return;
  }

  const datasets: any[] = [];

  const getPricesStmt = db.prepare(`
    SELECT valeur_fonciere, surface_reelle_bati FROM dvf 
    WHERE code_postal = ? AND strftime('%Y', date_mutation) = ? AND type_local = 'Appartement'
  `);

  for (const [index, zipCode] of Object.entries(zipCodes)) {
    // For each year, fetch all price_per_sqm values for this zip code
    const pricesByYear: Record<
      number,
      {
        prices: number[];
        median: number;
        average: number;
        min: number;
        max: number;
        count: number;
      }
    > = {};

    for (const year of years) {
      const rows = getPricesStmt.all(zipCode, year) as PriceRow[];

      const prices: number[] = rows
        .map((row) => calculatePricePerSqm(row.valeur_fonciere, row.surface_reelle_bati))
        .filter((p): p is number => p != null);

      const stats = getPriceStats(prices);
      if (stats) {
        pricesByYear[year] = stats;
      }
    }

    // Build dataset using median values
    const data = years.map((year) => pricesByYear[year]?.median ?? null);

    datasets.push({
      data,
      label: zipCode,
      backgroundColor: colors[Number(index) % colors.length],
      borderColor: colors[Number(index) % colors.length],
    });
  }

  db.close();

  const configuration: any = {
    type: "line",
    data: {
      datasets,
      labels: years,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Median Price per m² (€)",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Year",
          },
        },
        y: {
          title: {
            display: true,
            text: "Price per m² (€)",
          },
        },
      },
    },
    plugins: [],
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(path.join(graphsFolder, `${zipCodes.join("-")}.png`), image);
}

drawGraph().catch(console.error);
