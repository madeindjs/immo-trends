const fs = require("fs");
const readline = require("readline");

/**
 *
 * @param {string} pathToFile
 * @returns {Promise<string>}
 */
async function getFirstLineOfFile(pathToFile) {
  const readable = fs.createReadStream(pathToFile);
  const reader = readline.createInterface({ input: readable });
  const line = await new Promise((resolve) => {
    reader.on("line", (line) => {
      reader.close();
      resolve(line);
    });
  });
  readable.close();
  return line;
}

module.exports = { getFirstLineOfFile };
