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
    .readFileSync(join(__dirname, './template/midway/user.text'))
    .toString();

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  traverse(ast, {
    ImportDeclaration: (path) => {
      const { node } = path;
      if (options.isAliMidway && t.isStringLiteral(node.source, { value: 'midway' })) {
        node.source = t.stringLiteral('@ali/midway');
      }
    },
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
    },

    CallExpression: (path) => {
      const { node } = path;
      if (
        t.isMemberExpression(node.callee)
        && t.isIdentifier(node.callee.property, { name: 'define' })
      ) {
        node.arguments[0] = t.stringLiteral(definition.modelName);
      }
      if (t.isIdentifier(node.callee, { name: 'providerWrapper' })) {
        traverse(
          node,
          {
            ObjectProperty: (path1) => {
              const { node: node1 } = path1;
              if (t.isIdentifier(node1.key, { name: 'id' })) {
                node1.value = t.stringLiteral(bigCamelCase(definition.modelName));
              }
            },
          },
          { path },
        );
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
    .readFileSync(join(__dirname, './template/midway/user.d.text'))
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

function generateDB(options) {
  let code = fs
    .readFileSync(join(__dirname, './template/midway/user.db.text'))
    .toString();
  if (options.isAliMidway) {
    code = code.replace('midway', '@ali/midway');
  }
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

  const dbCodes = {
    file: 'db.ts',
    code: generateDB(options),
    fileType: 'model',
  };
  const codes = _.concat([], modelCodes, definitionCodes, dbCodes);
  return codes;
}

module.exports = process;
