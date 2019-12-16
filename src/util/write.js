const path = require('path');
const fs = require('fs-extra');
const debug = require('debug')('sequelize-automate');


async function writeFile(code, dir, fileName) {
  const dirPath = path.join(process.cwd(), dir);
  await fs.ensureDir(dirPath);
  const filePath = path.join(dirPath, fileName);
  debug('write file', filePath);
  await fs.writeFile(filePath, code);
}

/**
 * Write files
 * @param {array} codes [{ file, code, fileType }]
 * @param {object} options { dir, typesDir }
 */
async function write(codes, options) {
  const list = codes.map((code) => {
    const dir = code.fileType === 'model' ? options.dir : options.typesDir;
    return writeFile(code.code, dir, code.file);
  });
  return Promise.all(list);
}

module.exports = {
  write,
};
