const _ = require('lodash');
const midway = require('./midway');

function processMidway(definitions) {
  const modelCodes = definitions.map((definition) => {
    const { modelFileName } = definition;
    const fileType = 'model';
    const file = `${modelFileName}.ts`;
    const code = midway.generateCode(definition);
    return {
      file,
      code,
      fileType,
    };
  });

  const definitionCodes = definitions.map((definition) => {
    const { modelFileName } = definition;
    const fileType = 'definition';
    const file = `${modelFileName}.d.ts`;
    const code = midway.generateDefinition(definition);
    return {
      file,
      code,
      fileType,
    };
  });

  const dbCodes = {
    fileType: 'model',
    file: 'db.ts',
    code: midway.generateDB(),
  };
  const codes = _.concat([], modelCodes, definitionCodes, dbCodes);
  return codes;
}

/**
 * Generate model code
 * @param {object} definition definition
 * @param {string} type
 */
function generate(definition, type) {
  switch (type) {
    case 'midway':
      return processMidway(definition);
    default:
      break;
  }
  return null;
}

module.exports = generate;
