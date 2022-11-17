const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const sanitize = require("sanitize-filename");

function fileExists(filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err) => {
      if (err == null) {
        resolve(true);
      } else if (err.code === "ENOENT") {
        resolve(false);
      } else {
        reject(err.code);
      }
    });
  });
}

function createFolder(folder) {
  return fsp.mkdir(path.join(__dirname, "..", "dist", folder)).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
}

/**
 *
 * @param {string} zipCode
 * @param {string} name
 * @param {string | Buffer} content
 */
async function writeZipCodeFile(zipCode, name, content) {
  await createFolder(zipCode);

  await fsp.writeFile(path.join(__dirname, "..", "dist", zipCode, name), content);
}

/**
 * @param {string} name
 * @return {string}
 */
function getCacheFilePath(name) {
  return path.join(__dirname, "..", ".cache", sanitize(name));
}

module.exports = { fileExists, getCacheFilePath, writeZipCodeFile };



