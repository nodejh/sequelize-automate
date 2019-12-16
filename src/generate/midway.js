/* eslint-disable no-case-declarations */
const _ = require('lodash');
const { parse } = require('@babel/parser');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const { default: traverse } = require('@babel/traverse');
const fs = require('fs');
const { join } = require('path');
const { bigCamelCase } = require('../util/wordCase');

// https://github.com/babel/babel/issues/9804
// support chinese character
const generateOptions = {
  jsescOption: {
    minimal: true,
  },
  jsonCompatibleStrings: true,
};

function getDefaultValueExpression(defaultValue) {
  if (_.isString(defaultValue)) {
    if (defaultValue.toLowerCase().indexOf('sequelize') === 0) {
      return parse(defaultValue).program.body[0].expression;
    }
    return t.stringLiteral(defaultValue);
  }

  if (_.isNumber(defaultValue)) {
    return t.numericLiteral(defaultValue);
  }

  return t.nullLiteral();
}

function processFieldProperties(field) {
  const properties = [];
  _.forEach(field, (value, key) => {
    switch (key) {
      case 'type':
        const typeAst = parse(value).program.body[0].expression;
        properties.push(t.objectProperty(t.identifier(key), typeAst));
        break;
      case 'allowNull':
        properties.push(
          t.objectProperty(t.identifier(key), t.booleanLiteral(Boolean(value))),
        );
        break;
      case 'defaultValue':
        properties.push(
          t.objectProperty(t.identifier(key), getDefaultValueExpression(value)),
        );
        break;
      case 'primaryKey':
        properties.push(
          t.objectProperty(t.identifier(key), t.booleanLiteral(Boolean(value))),
        );
        break;
      case 'autoIncrement':
        properties.push(
          t.objectProperty(t.identifier(key), t.booleanLiteral(Boolean(value))),
        );
        break;
      case 'comment':
        properties.push(
          t.objectProperty(
            t.identifier(key),
            _.isString(value) ? t.stringLiteral(value) : t.nullLiteral(),
          ),
        );
        break;
      case 'field':
        properties.push(
          t.objectProperty(t.identifier(key), t.stringLiteral(value)),
        );
        break;
      case 'unique':
        properties.push(
          t.objectProperty(
            t.identifier(key),
            _.isString(value)
              ? t.stringLiteral(value)
              : t.booleanLiteral(Boolean(value)),
          ),
        );
        break;
      case 'references':
        if (_.isPlainObject(value) && !_.isEmpty(value)) {
          properties.push(
            t.objectProperty(
              t.identifier(key),
              t.objectExpression([
                t.objectProperty(
                  t.identifier('key'),
                  t.stringLiteral(value.key),
                ),
                t.objectProperty(
                  t.identifier('model'),
                  t.stringLiteral(value.model),
                ),
              ]),
            ),
          );
        }
        break;
      default:
        break;
    }
  });

  return properties;
}

function processAttributesProperties(attributes) {
  const properties = [];
  _.forEach(attributes, (field, fieldName) => {
    properties.push(
      t.objectProperty(
        t.identifier(fieldName),
        t.objectExpression(processFieldProperties(field)),
      ),
    );
  });
  return properties;
}

function processOptionsProperties(nodes, definition) {
  return nodes.map((item) => {
    const node = item;
    switch (node.key.name) {
      case 'tableName':
        node.value = t.stringLiteral(definition.tableName);
        break;
      case 'comment':
        node.value = t.stringLiteral(definition.tableComment || '');
        break;
      case 'indexs':
        node.value = t.arrayExpression(
          _.map(definition.indexs, (value) => {
            const index = t.objectExpression([
              t.objectProperty(
                t.identifier('name'),
                t.stringLiteral(value.name),
              ),
              t.objectProperty(
                t.identifier('unique'),
                t.booleanLiteral(Boolean(value.unique)),
              ),
              t.objectProperty(
                t.identifier('type'),
                t.stringLiteral(value.type),
              ),
              t.objectProperty(
                t.identifier('fields'),
                t.arrayExpression(
                  _.map(value.fields, (field) => t.stringLiteral(field)),
                ),
              ),
            ]);
            return index;
          }),
        );
        break;
      default:
        break;
    }
    return node;
  });
}

/**
 * Generate codes
 * @param {object} definition
 */
function generateCode(definition) {
  const source = fs
    .readFileSync(join(__dirname, './template/midway.text'))
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
                node1.value = t.stringLiteral(definition.modelName);
              }
            },
          },
          { path },
        );
      }
    },
  });

  const { code } = generate(ast, generateOptions);
  return code;
}

/**
 * get object type annotation
 * @param {string} type field type
 */
function getObjectTypeAnnotation(type) {
  if (type.indexOf('DataTypes.BOOLEAN') > -1) {
    return t.booleanTypeAnnotation();
  }
  if (type.indexOf('DataTypes.INTEGER') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.BIGINT') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.STRING') > -1) {
    return t.stringTypeAnnotation();
  }
  if (type.indexOf('DataTypes.CHAR') > -1) {
    return t.stringTypeAnnotation();
  }
  if (type.indexOf('DataTypes.REAL') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.TEXT') > -1) {
    return t.stringTypeAnnotation();
  }
  if (type.indexOf('DataTypes.DATE') > -1) {
    return t.genericTypeAnnotation(t.identifier('Date'));
  }
  if (type.indexOf('DataTypes.FLOAT') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.DECIMAL') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.DOUBLE') > -1) {
    return t.numberTypeAnnotation();
  }
  if (type.indexOf('DataTypes.UUIDV4') > -1) {
    return t.stringTypeAnnotation();
  }
  return t.anyTypeAnnotation();
}

function generateDefinition(definition) {
  const source = fs
    .readFileSync(join(__dirname, './template/midway.d.text'))
    .toString();

  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  const commonName = `I${bigCamelCase(
    definition.tableName,
  )}`;
  const attribute = ast.program.body[1];
  attribute.declaration.id = t.identifier(`${commonName}Attribute`);
  attribute.declaration.body = t.objectTypeAnnotation(
    _.map(definition.attributes, (field, key) => {
      const type = getObjectTypeAnnotation(field.type);
      return Object.assign(
        t.objectTypeProperty(t.identifier(key), type),
        {
          optional: false,
        },
      );
    }),
  );

  const tableInterface = ast.program.body[2];
  tableInterface.declaration.id = t.identifier(`${commonName}Instance`);

  traverse(
    tableInterface,
    {
      enter(path) {
        if (path.isIdentifier({ name: 'IUserAttribute' })) {
          const { node } = path;
          node.name = `${commonName}Attribute`;
        }
      },
    },
    { path: tableInterface },
  );
  const modelInterface = ast.program.body[3];
  modelInterface.declaration.id = t.identifier(`${commonName}Model`);
  traverse(
    modelInterface,
    {
      enter(path) {
        if (path.isIdentifier({ name: 'IUserInstance' })) {
          const { node } = path;
          node.name = `${commonName}Instance`;
        }
        if (path.isIdentifier({ name: 'IUserAttribute' })) {
          const { node } = path;
          node.name = `${commonName}Attribute`;
        }
      },
    },
    { path: tableInterface },
  );
  const { code } = generate(ast, generateOptions);
  return code;
}

function generateDB() {
  const code = fs
    .readFileSync(join(__dirname, './template/midway.db.text'))
    .toString();
  return code;
}

module.exports = {
  generateCode,
  generateDefinition,
  generateDB,
};
