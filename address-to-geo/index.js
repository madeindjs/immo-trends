const { completeZipCode } = require("./utils");
const Knex = require("knex").default;
const path = require("path");

/**
 * @type {import('knex').Knex}
 */
let knex;

function getConnection() {
  if (knex) return knex;

  return (knex = Knex({ client: "sqlite3", connection: { filename: path.join(__dirname, "france.sqlite") } }));
}

function closeConnection() {
  if (knex) knex.destroy();
}

/**
 *
 * @param {{zipCode: string, town: string, street: string, number: string}} address
 * @returns {Promise<{lat: number, lon: number}>}
 */
async function findByAddress(address) {
  const zipCode = completeZipCode(address.zipCode);

  const dep = zipCode.substring(0, 2);

  const table = `adresses-${dep}`;

  const query = getConnection()(table).select(["lon", "lat"]).where({
    code_postal: zipCode,
    libelle_acheminement: address.town,
    nom_afnor: address.street, // ~10% without
    // numero: address.number,
  });

  // console.log("query", query.toSQL().sql, query.toSQL().bindings);

  const record = await query.first();

  // closeConnection();

  if (!record) {
    console.log(
      "Could not find address for ",
      {
        code_postal: zipCode,
        nom_commune: address.town,
        nom_voie: address.street,
        numero: address.number,
      },
      query.toSQL().sql,
      query.toSQL().bindings
    );
    return { lon: 0, lat: 0 };
  }

  console.log("**** find adress");

  return { lon: Number(record.lon), lat: Number(record.lat) };
}

module.exports = { findByAddress, getConnection, closeConnection };
