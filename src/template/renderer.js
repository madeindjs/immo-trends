let ejs = require("ejs");
const path = require("path");

const { writeZipCodeFile, writeInDist } = require("../file");

async function renderTemplate(template, payload = {}) {
  const html = await ejs.renderFile(path.join(__dirname, template), payload, { beautify: false, rmWhitespace: true });

  await writeZipCodeFile(payload.zipCode, "index.html", html);
}

async function renderHomeTemplate(payload = {}) {
  const html = await ejs.renderFile(path.join(__dirname, "home.ejs"), payload, { beautify: false, rmWhitespace: true });

  await writeInDist("index.html", html);
}

module.exports = { renderTemplate, renderHomeTemplate };
