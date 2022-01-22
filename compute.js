// @ts-check
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");
const ProgressBar = require("progress");

const fields =
  "Code service CH|Reference document|1 Articles CGI|2 Articles CGI|3 Articles CGI|4 Articles CGI|5 Articles CGI|No disposition|Date mutation|Nature mutation|Valeur fonciere|No voie|B/T/Q|Type de voie|Code voie|Voie|Code postal|Commune|Code departement|Code commune|Prefixe de section|Section|No plan|No Volume|1er lot|Surface Carrez du 1er lot|2eme lot|Surface Carrez du 2eme lot|3eme lot|Surface Carrez du 3eme lot|4eme lot|Surface Carrez du 4eme lot|5eme lot|Surface Carrez du 5eme lot|Nombre de lots|Code type local|Type local|Identifiant local|Surface reelle bati|Nombre pieces principales|Nature culture|Nature culture speciale|Surface terrain".split(
    "|"
  );

const surface1Index = fields.indexOf("Surface Carrez du 1er lot");
const surface2Index = fields.indexOf("Surface Carrez du 2eme lot");
const surface3Index = fields.indexOf("Surface Carrez du 3eme lot");
const surface4Index = fields.indexOf("Surface Carrez du 4eme lot");
const surface5Index = fields.indexOf("Surface Carrez du 5eme lot");
const zipCodeIndex = fields.indexOf("Code postal");
const priceIndex = fields.indexOf("Valeur fonciere");
const kindIndex = fields.indexOf("Type local");

const dataFolder = path.join(__dirname, "data");
const computesFolder = path.join(__dirname, "computes");

const files = {
  2016: path.join(dataFolder, "valeursfoncieres-2016-s2.txt"),
  2017: path.join(dataFolder, "valeursfoncieres-2017.txt"),
  2018: path.join(dataFolder, "valeursfoncieres-2018.txt"),
  2019: path.join(dataFolder, "valeursfoncieres-2019.txt"),
  2020: path.join(dataFolder, "valeursfoncieres-2020.txt"),
  2021: path.join(dataFolder, "valeursfoncieres-2021-s1.txt"),
};

/**
 * @param {string} number
 * @returns {number}
 */
function parseNumberFr(number) {
  return parseInt(number.split(",")[0]);
}

/**
 * @param {string[]} row
 * @param {number} index
 */
function getNumber(row, index) {
  const surface = row[index];

  return surface ? parseNumberFr(surface) : undefined;
}

/**
 * @param {string[]} row
 * @param {number} index
 */
const getString = (row, index) => row[index];

/**
 * @param {number[]} array
 * @returns {number}
 */
function getAverage(array) {
  const total = array.reduce((acc, c) => acc + c, 0);
  return total / array.length;
}

/**
 * @param {number[]} array
 * @returns {number}
 */
function getMedian(array) {
  array = array.slice(0).sort(function (x, y) {
    return x - y;
  });
  var b = (array.length + 1) / 2;
  return array.length % 2 ? array[b - 1] : (array[b - 1.5] + array[b - 0.5]) / 2;
}

function computeSurfacePricesPerZipCode(year) {
  const filepath = files[year];
  const total = parseInt(execSync(`wc -l < ${filepath}`).toString().trim());
  const filename = path.basename(filepath);
  const bar = new ProgressBar(`READ ${year} :bar (ETA :eta s)`, { total });

  const input = fs.createReadStream(filepath);
  const rl = readline.createInterface({ input });

  const surfacePicePerZipCode = {};

  const handleLine = (rowString) => {
    bar.tick();
    const row = rowString.split("|");

    const kind = getString(row, kindIndex);

    if (kind !== "Appartement") {
      return;
    }

    const surface =
      (getNumber(row, surface1Index) ?? 0) +
      (getNumber(row, surface2Index) ?? 0) +
      (getNumber(row, surface3Index) ?? 0) +
      (getNumber(row, surface4Index) ?? 0) +
      (getNumber(row, surface5Index) ?? 0);

    if (!surface) {
      return;
    }

    const price = getNumber(row, priceIndex);
    if (!price) {
      return;
    }

    const zipCode = getString(row, zipCodeIndex);

    if (!zipCode) {
      return;
    }

    surfacePicePerZipCode[zipCode] ??= [];
    surfacePicePerZipCode[zipCode].push(price / surface);

    const result = { surface, price, kind, zipCode };
    // log(`READ - ${filename} - ${JSON.stringify(result)}`);
  };

  return new Promise((resolve, reject) => {
    rl.on("line", handleLine);
    rl.on("SIGTSTP", reject);
    rl.on("SIGINT", reject);
    rl.on("close", () => {
      resolve(surfacePicePerZipCode);
    });
  });
}

function isFileExists(file) {
  return new Promise((res) => fs.stat(file, (err) => res(!err)));
}

async function compute(year) {
  const resultFile = path.join(computesFolder, `${year}.json`);
  if (await isFileExists(resultFile)) {
    return;
  }

  const surfacePricesPerZipCode = await computeSurfacePricesPerZipCode(year);
  const averagePricePerZipCode = {};

  for (const [zipCode, prices] of Object.entries(surfacePricesPerZipCode)) {
    averagePricePerZipCode[zipCode] = {
      median: getMedian(prices),
      average: getAverage(prices),
      count: prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  fs.writeFileSync(resultFile, JSON.stringify(averagePricePerZipCode, undefined, 2));
}

Promise.all([compute(2016), compute(2017), compute(2018), compute(2019), compute(2020), compute(2021)]).catch(
  console.error
);
// Promise.all([compute(2020), compute(2021)]).catch(console.error);
