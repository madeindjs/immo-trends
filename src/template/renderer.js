let ejs = require("ejs");
const path = require("path");

const { writeZipCodeFile, writeInDist } = require("../file");

const defaultPayload = {
  appName: "Rapports DVF",
};

async function renderTemplate(template, payload = {}) {
  const html = await ejs.renderFile(
    path.join(__dirname, template),
    { ...defaultPayload, ...payload },
    { beautify: false, rmWhitespace: true }
  );

  await writeZipCodeFile(payload.zipCode, "index.html", html);
}

async function renderHomeTemplate(payload = {}) {
  const html = await ejs.renderFile(
    path.join(__dirname, "home.ejs"),
    { ...defaultPayload, ...payload },
    { beautify: false, rmWhitespace: true }
  );

  await writeInDist("index.html", html);
}

module.exports = { renderTemplate, renderHomeTemplate };
