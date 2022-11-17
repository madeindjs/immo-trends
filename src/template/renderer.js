let ejs = require("ejs");
const path = require("path");

const { writeZipCodeFile } = require("../file");

async function renderTemplate(template, payload = {}) {
  console.log(payload);
  const html = await ejs.renderFile(path.join(__dirname, template), payload, { beautify: false, rmWhitespace: true });

  await writeZipCodeFile(payload.zipCode, "index.html", html);
}

module.exports = { renderTemplate };
