const { parse, transform, stringify } = require("csv");
const { transformDateFrToISO } = require("./utils");

const { findByAddress } = require("address-to-geo");

const parser = parse({ delimiter: "|", toLine: 5, columns: true });

async function transformerHandler(row) {
  console.log("transformerHandler", row);

  const zipCode = row["Code postal"];
  // const dep = row["Code departement"];

  const { lat, lon } = await findByAddress({
    zipCode,
    number: row["No voie"],
    street: row["Voie"],
    town: row["Commune"],
  }).catch(() => ({ lat: 0, lon: 0 }));

  console.log(lat, lon);

  return {
    zipCode,
    mutationDate: transformDateFrToISO(row["Date mutation"]),
    lat,
    lon,
  };
}

const transformer = transform((row, callback) =>
  transformerHandler(row).then((row) => {
    callback(null, row);
  })
);

const stringifier = stringify({
  header: true,
  // columns: {
  //   year: "birthYear",
  //   phone: "phone",
  // },
});

process.stdin
  // createReadStream("../data/valeursfoncieres-2016-s2.txt")
  .pipe(parser)
  .pipe(transformer)
  .pipe(stringifier)
  .pipe(process.stdout)
  .on("end", (data) => {
    // TODO close db connection
    console.log("end");
  });
