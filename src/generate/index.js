const processJS = require('./javascript');
const processTS = require('./typescript');
const processMidway = require('./midway');


/**
 * Generate model code
 * @param {object} definition definition
 * @param {object} options
 */
function generate(definition, options) {
  const { type, tsNoCheck } = options;
  switch (type) {
    case 'js':
      return processJS(definition, { isEgg: false });
    case 'ts':
      return processTS(definition, { tsNoCheck });
    case 'egg':
      return processJS(definition, { isEgg: true });
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
