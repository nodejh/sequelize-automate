const generateMidway = require('./midway');

/**
 * Generate model code
 * @param {object} definition definition
 * @param {string} type
 */
function generate(definition, type) {
  switch (type) {
    case 'midway':
      return generateMidway(definition);
    default:
      break;
  }
  return null;
}

module.exports = generate;
