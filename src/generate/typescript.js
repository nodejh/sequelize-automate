const _ = require('lodash');
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
  getObjectTypeAnnotation,
} = require('./common/index');


/**
 * Generate codes
 * @param {object} definition
 * @param {object} options
 */
function generateCode(definition, options) {
  const source = fs
    .readFileSync(join(__dirname, './template/typescript/user.text'))
    .toString();

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
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

  if (options.tsNoCheck) {
    t.addComment(ast.program.body[0], 'leading', '@ts-nocheck', true);
  }

  const { code } = generate(ast, generateOptions);
  return code;
}


function generateDefinition(definition) {
  const source = fs
    .readFileSync(join(__dirname, './template/typescript/user.d.text'))
    .toString();

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  const name = `I${bigCamelCase(
    definition.tableName,
  )}`;
  const attribute = ast.program.body[1];
  attribute.declaration.id = t.identifier(`${name}Attributes`);
  attribute.declaration.body = t.objectTypeAnnotation(
    _.map(definition.attributes, (field, key) => {
      const type = getObjectTypeAnnotation(field.type);
      return Object.assign(
        t.objectTypeProperty(t.identifier(key), type),
        {
          optional: Boolean(field.allowNull),
        },
      );
    }),
  );

  const model = ast.program.body[2];
  traverse(
    model,
    {
      enter(path) {
        if (path.isIdentifier({ name: 'IUserModel' })) {
          const { node } = path;
          node.name = `${name}Model`;
        }
        if (path.isIdentifier({ name: 'IUserAttributes' })) {
          const { node } = path;
          node.name = `${name}Attributes`;
        }
      },
    },
    { path: model },
  );

  const modelStatic = ast.program.body[3];
  modelStatic.declaration.id = t.identifier(`${name}ModelStatic`);

  traverse(
    modelStatic,
    {
      enter(path) {
        if (path.isIdentifier({ name: 'IUserModel' })) {
          const { node } = path;
          node.name = `${name}Model`;
        }
      },
    },
    { path: modelStatic },
  );
  const { code } = generate(ast, generateOptions);
  return code;
}

function process(definitions, options) {
  const modelCodes = definitions.map((definition) => {
    const { modelFileName } = definition;
    const fileType = 'model';
    const file = `${modelFileName}.ts`;
    const code = generateCode(definition, options);
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
    const code = generateDefinition(definition);
    return {
      file,
      code,
      fileType,
    };
  });

  const codes = _.concat([], modelCodes, definitionCodes);
  return codes;
}

module.exports = process;
