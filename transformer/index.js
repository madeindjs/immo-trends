const { parse, transform, stringify } = require("csv");
const { transformDateFrToISO } = require("./utils");

const { findByAddress, closeConnection } = require("address-to-geo");

const parser = parse({ delimiter: "|", toLine: 5, columns: true });

async function transformerHandler(row) {
  // console.log("transformerHandler", row);

  const zipCode = row["Code postal"];
  // const dep = row["Code departement"];

  const { lat, lon } = await findByAddress({
    zipCode,
    number: row["No voie"],
    street: row["Voie"],
    town: row["Commune"],
  });

  // console.log(lat, lon);

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
    closeConnection();
    console.log("end");
  });



