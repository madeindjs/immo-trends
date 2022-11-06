const https = require("https");
const { createReadStream } = require("fs");
const { parse } = require("csv");
const path = require("path");
const { spawn, exec } = require("node:child_process");
const { getFirstLineOfFile } = require("./utils");

// let csvHeader;

// async function getCsvHeader() {

//   getFirstLineOfFile()

// }

const parser = parse({
  delimiter: ";",
  columns:
    "id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;type_position;alias;nom_ld;libelle_acheminement;nom_afnor;source_position;source_nom_voie;certification_commune;cad_parcelles".split(
      ";"
    ),
  skip_records_with_error: true,
});

/**
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSameStr(a, b) {
  return a?.toLowerCase() === b?.toLowerCase();
}

/**
 *
 * @param {{zipCode: string, dep: string}} address
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function find(address) {
  // const dep = address.zipCode.substring(0, 2);

  const url = path.join(
    __dirname,
    "adresse.data.gouv.fr",
    "data",
    "ban",
    "adresses",
    "latest",
    "csv",
    `adresses-${address.dep}.csv`
  );

  // const header = await getFirstLineOfFile(url);

  // .pipe()

  console.log(`exec: rg -e "${address.zipCode}" "${url}"`);

  return new Promise((resolve, reject) => {
    const stream = spawn("rg", ["-e", address.zipCode, "-e", "code_postal", url])
      .stdout.pipe(parser)
      .on("data", (row) => {
        // console.log(row, address.zipCode);
        if (!isSameStr(row["code_postal"], address.zipCode)) return;

        if (true) {
          console.log(row);
          resolve({ lat: Number(row["lat"]), lng: Number(row["lon"]) });
          stream.destroy();
        }
      })
      .on("error", (err) => {
        console.error(`error with ${url}`, err);
        reject(err);
      });
  });

  // for await (const record of stream) {
  //   return record;
  //   // // Report current line
  //   // process.stdout.write(`${count++} ${record.join(",")}\n`);
  //   // // Fake asynchronous operation
  //   // await new Promise((resolve) => setTimeout(resolve, 100));
  // }

  // return { lat: 1, lng: 2 };
}

module.exports = { find };
