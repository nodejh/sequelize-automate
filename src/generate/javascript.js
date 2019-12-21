const { parse } = require('@babel/parser');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const { default: traverse } = require('@babel/traverse');
const fs = require('fs');
const { join } = require('path');
const { bigCamelCase } = require('../util/wordCase');
const {
  generateOptions,
  processAttributesProperties,
  processOptionsProperties,
} = require('./common/index');


/**
 * Generate codes
 * @param {object} definition
 * @param {object} options
 */
function generateCode(definition, options) {
  const file = options.isEgg ? './template/egg/user.text' : './template/javascript/user.text';
  const source = fs
    .readFileSync(join(__dirname, file))
    .toString();

  const ast = parse(source, {
    strictMode: true,
  });

  traverse(ast, {
    VariableDeclarator: (path) => {
      const { node } = path;
      if (t.isIdentifier(node.id, { name: 'attributes' })) {
        const properties = processAttributesProperties(definition.attributes);
        node.init = t.objectExpression(properties);
      }

      if (t.isIdentifier(node.id, { name: 'options' })) {
        const properties = processOptionsProperties(
          node.init.properties,
          definition,
        );
        node.init = t.objectExpression(properties);
      }

      if (t.isIdentifier(node.id, { name: 'UserModel' })) {
        node.id = t.identifier(bigCamelCase(definition.modelName));
      }
    },

    CallExpression: (path) => {
      const { node } = path;
      if (
        t.isMemberExpression(node.callee)
        && t.isIdentifier(node.callee.property, { name: 'define' })
      ) {
        node.arguments[0] = t.stringLiteral(definition.modelName);
      }
    },

    ReturnStatement: (path) => {
      const { node } = path;
      if (t.isIdentifier(node.argument, { name: 'UserModel' })) {
        node.argument = t.identifier(bigCamelCase(definition.modelName));
      }
    },
  });


  const { code } = generate(ast, generateOptions);
  return code;
}

function process(definitions, options) {
  const modelCodes = definitions.map((definition) => {
    const { modelFileName } = definition;
    const fileType = 'model';
    const file = `${modelFileName}.js`;
    const code = generateCode(definition, options);
    return {
      file,
      code,
      fileType,
    };
  });
  return modelCodes;
}

module.exports = process;
