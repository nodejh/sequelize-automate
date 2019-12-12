const _ = require('lodash');

function getField(fieldName, camelCase) {
  return camelCase ? _.camelCase(fieldName) : fieldName;
}

/**
 * Process a table
 * @param {object} options { structures, allIndexs, options }
 * @return {object} { attributes: { filed: { attribute } } indexs: [{ name, type, fields }] }
 */
function processTable({
  structures,
  allIndexs,
  options,
}) {
  const { camelCase } = options;
  const attributes = {};
  _.forEach(structures, (structure, fieldName) => {
    const field = getField(fieldName, camelCase);
    attributes[field] = structure;
    attributes[field].field = fieldName;
  });

  const indexs = [];
  _.forEach(allIndexs, (index) => {
    const fields = index.fields.map((o) => o.attribute);
    if (index.primary === true) {
      _.forEach(fields, (fieldName) => {
        const field = getField(fieldName, camelCase);
        attributes[field].primaryKey = true;
      });
    } else if (index.unique && fields.length === 1) {
      const field = getField(fields[0], camelCase);
      attributes[field].unique = index.name;
    } else {
      indexs.push({
        name: index.name,
        unique: index.unique,
        type: index.type,
        fields,
      });
    }
  });

  return { attributes, indexs };
}

/**
 * Get model definitions
 * @param {object} tables { structures, indexs, foreignKeys }
 * @param {object} options { camelCase }
 * @return {object} [{ attributes, indexs }]
 */
function getModelDefinitions(tables, options) {
  const { camelCase = false } = options || {};
  const definitions = _.map(tables, (table, tableName) => {
    const { attributes, indexs } = processTable({
      structures: table.structures,
      allIndexs: table.indexs,
      options: { camelCase },
    });

    return {
      tableName,
      attributes,
      indexs,
    };
  });

  return definitions;
}

module.exports = {
  getField,
  processTable,
  getModelDefinitions,
};
