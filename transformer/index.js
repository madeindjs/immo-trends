// @ts-check
const { parse, transform, stringify } = require("csv");
// const {parse} = require('csv-parse')
// const { createReadStream, createWriteStream } = require("fs");
const { transformDateFrToISO } = require("./utils");

const { find } = require("address-to-geo");

// function handler(data) {
//   console.log("receive", data);
// }

const parser = parse({ delimiter: "|", toLine: 5, columns: true });

async function transformerHandler(row) {
  console.log("transformerHandler", row);

  const zipCode = row["Code postal"];
  // const dep = row["Code departement"];

  const { lat, lng } = await find({ zipCode, dep }).catch(() => ({ lat: 0, lng: 0 }));

  console.log(lat, lng);

  return {
    zipCode,
    mutationDate: transformDateFrToISO(row["Date mutation"]),
    lat,
    lng,
  };
}

const transformer = transform((row, callback) =>
  transformerHandler(row).then((row) => {
    // if (row.zipCode) {
    // }

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
  // .on("data", handler)
  .on("end", (data) => {
    console.log("end");
  });
