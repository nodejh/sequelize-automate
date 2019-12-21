const processEgg = require('./egg');
const processMidway = require('./midway');


/**
 * Generate model code
 * @param {object} definition definition
 * @param {object} options
 */
function generate(definition, options) {
  const { type, tsNoCheck } = options;
  switch (type) {
    case 'egg':
      return processEgg(definition);
    case 'midway':
      return processMidway(definition, { tsNoCheck });
    case '@ali/midway':
      // special for @ali/midway
      return processMidway(definition, { tsNoCheck, isAliMidway: true });
    default:
      break;
  }
  return null;
}

module.exports = generate;
