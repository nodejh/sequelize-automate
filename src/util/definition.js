const _ = require('lodash');

function getFieldName(fieldName, camelCase) {
  return camelCase ? _.camelCase(fieldName) : fieldName;
}

function getModelName(tableName, camelCase) {
  return `${getFieldName(tableName, camelCase)}Model`;
}

/**
 * Get default value
 * @param {object} field field
 * @param {string} dialect -dialect
 */
function getDefaultValue(field, dialect) {
  let { defaultValue } = field;
  if (
    dialect === 'mssql'
    && field.defaultValue
    && field.defaultValue.toLowerCase() === '(newid())'
  ) {
    // disable adding "default value" attribute for UUID fields if generating for MS SQL
    defaultValue = null;
  }

  // Bit fix
  if (field.type.toLowerCase() === 'bit(1)') {
    // mysql Bit fix
    defaultValue = field.defaultValue === "b'1'" ? 1 : 0;
  } else if (dialect === 'mssql' && field.type.toLowerCase() === 'bit') {
    // mssql bit fix
    defaultValue = field.defaultValue === '((1))' ? 1 : 0;
  }

  if (_.isString(field.defaultValue)) {
    const fieldType = field.type.toLowerCase();
    if (_.endsWith(field.defaultValue, '()')) {
      defaultValue = `sequelize.fn('${field.defaultValue.replace(
        /\(\)$/,
        '',
      )}')`;
    } else if (
      fieldType.indexOf('date') === 0
      || fieldType.indexOf('timestamp') === 0
    ) {
      if (
        _.includes(
          [
            'current_timestamp',
            'current_date',
            'current_time',
            'localtime',
            'localtimestamp',
          ],
          field.defaultValue.toLowerCase(),
        )
      ) {
        defaultValue = `sequelize.literal('${field.defaultValue}')`;
      }
    }
  }

  return defaultValue;
}

/**
 * Get data type
 * @param {object} field table field
 * @return {string}
 */
function getDataType(field) {
  if (field.type.indexOf('ENUM') === 0) {
    return `DataTypes.${field.type}`;
  }

  const attr = (field.type || '').toLowerCase();

  if (attr === 'boolean' || attr === 'bit(1)' || attr === 'bit') {
    return 'DataTypes.BOOLEAN';
  }

  const length = attr.match(/\(\d+\)/);
  const typeLength = !_.isNull(length) ? length : '';
  if (attr.match(/^(smallint|mediumint|tinyint|int)/)) {
    const typeInt = attr.match(/^bigint/) ? 'BIGINT' : 'INTEGER';

    let type = `DataTypes.${typeInt}${typeLength}`;
    const unsigned = attr.match(/unsigned/i);
    if (unsigned) {
      type += '.UNSIGNED';
    }
    const zero = attr.match(/zerofill/i);
    if (zero) {
      type += '.ZEROFILL';
    }

    return type;
  }

  if (attr.match(/^bigint/)) {
    let type = 'DataTypes.BIGINT';
    const unsigned = attr.match(/unsigned/i);
    if (unsigned) {
      type += '.UNSIGNED';
    }

    const zero = attr.match(/zerofill/i);
    if (zero) {
      type += '.ZEROFILL';
    }
    return type;
  }

  if (attr.match(/^varchar/)) {
    return `DataTypes.STRING${typeLength}`;
  }

  if (attr.match(/^char/)) {
    return `DataTypes.CHAR${typeLength}`;
  }

  if (attr.match(/^real/)) {
    return 'DataTypes.REAL';
  }

  if (attr.match(/text|ntext$/)) {
    return 'DataTypes.TEXT';
  }

  if (attr === 'date') {
    return 'DataTypes.DATEONLY';
  }

  if (attr.match(/^(date|timestamp)/)) {
    return 'DataTypes.DATE';
  }

  if (attr.match(/^(time)/)) {
    return 'DataTypes.TIME';
  }

  if (attr.match(/^(float|float4)/)) {
    return 'DataTypes.FLOAT';
  }

  if (attr.match(/^decimal/)) {
    return 'DataTypes.DECIMAL';
  }

  if (attr.match(/^(float8|double precision|numeric)/)) {
    return 'DataTypes.DOUBLE';
  }

  if (attr.match(/^uuid|uniqueidentifier/)) {
    return 'DataTypes.UUIDV4';
  }

  if (attr.match(/^jsonb/)) {
    return 'DataTypes.JSONB';
  }

  if (attr.match(/^json/)) {
    return 'DataTypes.JSON';
  }

  if (attr.match(/^geometry/)) {
    return 'DataTypes.GEOMETRY';
  }

  return attr;
}

/**
 * Process a table
 * @param {object} params { structures, allIndexs, foreignKeys, options: { camelCase, dialect } }
 * @return {object} { attributes: { filed: { attribute } }, indexs: [{ name, type, fields }] }
 */
function processTable({
  structures,
  allIndexs,
  foreignKeys,
  options,
}) {
  const { camelCase, dialect } = options;
  const attributes = {};
  _.forEach(structures, (structure, fieldName) => {
    const key = getFieldName(fieldName, camelCase);
    attributes[key] = structure;
    attributes[key].field = fieldName;
    attributes[key].type = getDataType(structure);
    attributes[key].defaultValue = getDefaultValue(structure, dialect);
  });

  const indexs = [];
  _.forEach(allIndexs, (index) => {
    const fields = index.fields.map((o) => o.attribute);
    if (index.primary === true) {
      _.forEach(fields, (fieldName) => {
        const field = getFieldName(fieldName, camelCase);
        attributes[field].primaryKey = true;
      });
    } else if (index.unique && fields.length === 1) {
      const field = getFieldName(fields[0], camelCase);
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

  _.forEach(foreignKeys, (foreignKey) => {
    const {
      columnName,
      referencedTableName,
      referencedColumnName,
    } = foreignKey;
    const filed = getFieldName(columnName, camelCase);
    attributes[filed].references = {
      key: referencedColumnName,
      model: getModelName(referencedTableName, camelCase),
    };
  });

  return { attributes, indexs };
}

/**
 * Get model definitions
 * @param {object} tables { structures, indexs, foreignKeys }
 * @param {object} options { camelCase, modelFileNameCamelCase }
 * @return {object} [{ modelName, modelFileName, tableName, attributes, indexs }]
 */
function getModelDefinitions(tables, options) {
  const { camelCase, modelFileNameCamelCase } = options || {};
  const definitions = _.map(tables, (table, tableName) => {
    const { attributes, indexs } = processTable({
      structures: table.structures,
      allIndexs: table.indexs,
      foreignKeys: table.foreignKeys,
      options: { camelCase },
    });

    const modelName = getModelName(tableName, camelCase);
    const modelFileName = getFieldName(tableName, modelFileNameCamelCase);
    return {
      modelName,
      modelFileName,
      tableName,
      attributes,
      indexs,
    };
  });

  return definitions;
}

module.exports = {
  getDefaultValue,
  getDataType,
  getModelDefinitions,
};
