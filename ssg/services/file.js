const fs = require("fs");

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

module.exports = { fileExists };
