const path = require('path');
const fs = require('fs');
const debug = require('debug')('sequelize-automate');

function getFileExtension({ type, fileType }) {
  if (type === 'ts' || type === 'midway') {
    if (fileType === 'model') {
      return 'ts';
    }
    if (fileType === 'definition') {
      return 'd.ts';
    }
  }

  return 'js';
}

/**
 *
 * @param {array} codes [{ file, code, fileType }]
 * @param {object} options { dir, typesDir }
 */
function write(codes, options) {
  codes.forEach((code) => {
    const dir = code.fileType === 'model' ? options.dir : options.typesDir;

    const filePath = path.join(process.cwd(), dir, code.file);
    debug('write file', filePath);
    fs.writeFileSync(filePath, code.code);
  });
}

module.exports = {
  getFileExtension,
  write,
};
