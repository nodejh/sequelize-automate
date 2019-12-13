/* eslint-disable no-case-declarations */
const _ = require('lodash');
const { parse } = require('@babel/parser');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const { default: traverse } = require('@babel/traverse');
const fs = require('fs');
const { join } = require('path');


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
        properties.push(
          t.objectProperty(
            t.identifier(key),
            typeAst,
          ),
        );
        break;
      case 'allowNull':
        properties.push(
          t.objectProperty(t.identifier(key), t.booleanLiteral(Boolean(value))),
        );
        break;
      case 'defaultValue':
        properties.push(
          t.objectProperty(
            t.identifier(key),
            getDefaultValueExpression(value),
          ),
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

  const { code } = generate(ast);
  return code;
}

function generateDefinition() {
  return '';
}

module.exports = generateCode;
