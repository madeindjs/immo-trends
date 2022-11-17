let ejs = require("ejs");

const fs = require("fs/promises");
const path = require("path");
const { writeZipCodeFile } = require("../file");

async function renderTemplate(template, payload = {}) {
  const content = await fs.readFile(path.join(__dirname, template)).then((content) => content.toString("utf-8"));

  const html = await ejs.render(content, payload);

  await writeZipCodeFile(payload.zipCode, "index.html", html);
}

module.exports = { renderTemplate };
