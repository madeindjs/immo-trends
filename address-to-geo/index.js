const knex = require("knex")({
  client: "sqlite3", // or 'better-sqlite3'
  connection: {
    filename: "./france.sqlite",
  },
});

/**
 *
 * @param {{zipCode: string, town: string, street: string, number: string}} address
 * @returns {Promise<{lat: number, lon: number} | undefined>}
 */
async function find(address) {
  // TODO: add leading zero for zipcode
  const dep = address.zipCode.substring(0, 2);

  const table = `adresses-${dep}`;

  const record = await knex(table)
    // .select(["lon", "lat"])
    .where({
      code_postal: address.zipCode,
      nom_commune: address.town,
      nom_voie: address.street,
      numero: address.number,
    })
    .first();

  console.log(record);

  // knex.

  if (!record) return;

  return { lon: Number(record.lon), lat: Number(record.lat) };
}

module.exports = { find, _knex: knex };
