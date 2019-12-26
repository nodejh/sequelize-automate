/* eslint-disable no-case-declarations */
const _ = require('lodash');
const { parse } = require('@babel/parser');
const t = require('@babel/types');


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
      case 'indexes':
        node.value = t.arrayExpression(
          _.map(definition.indexes, (value) => {
            const properties = [
              t.objectProperty(
                t.identifier('name'),
                t.stringLiteral(value.name),
              ),
              t.objectProperty(
                t.identifier('unique'),
                t.booleanLiteral(Boolean(value.unique)),
              ),
              value.type && t.objectProperty(
                t.identifier('type'),
                t.stringLiteral(value.type),
              ),
              t.objectProperty(
                t.identifier('fields'),
                t.arrayExpression(
                  _.map(value.fields, (field) => t.stringLiteral(field)),
                ),
              ),
            ];
            const index = t.objectExpression(properties.filter((o) => o));
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


module.exports = {
  generateOptions,
  getDefaultValueExpression,
  processFieldProperties,
  processAttributesProperties,
  processOptionsProperties,
  getObjectTypeAnnotation,
};
