const fs = require("fs");
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

/**
 * @param {string} name
 * @return {string}
 */
function getCacheFilePath(name) {
  return path.join(__dirname, "..", ".cache", sanitize(name));
}

module.exports = { fileExists, getCacheFilePath };




