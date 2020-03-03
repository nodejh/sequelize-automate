const processJS = require('./javascript');
const processTS = require('./typescript');
const processMidway = require('./midway');


/**
 * Generate model code
 * @param {object} definition definition
 * @param {object} options
 */
function generate(definition, templatePath, options) {
  const { type, tsNoCheck } = options;
  switch (type) {
    case 'js':
      return processJS(definition, templatePath, { isEgg: false });
    case 'ts':
      return processTS(definition, templatePath, { tsNoCheck });
    case 'egg':
      return processJS(definition, templatePath, { isEgg: true });
    case 'midway':
      return processMidway(definition, templatePath, { tsNoCheck });
    case '@ali/midway':
      // special for @ali/midway
      return processMidway(definition, templatePath, { tsNoCheck, isAliMidway: true });
    default:
      break;
  }
  return null;
}

module.exports = generate;
