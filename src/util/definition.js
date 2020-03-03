const _ = require('lodash');

const regexpPostgresAutoIncrementValue = /nextval\(.*seq::regclass\)/;

function getFieldName(fieldName, camelCase) {
  return camelCase ? _.camelCase(fieldName) : fieldName;
}

function getModelName(tableName, camelCase, noModelSuffix) {
  const modelString = noModelSuffix
    ? ''
    : camelCase
      ? 'Model'
      : '_model';

  return `${getFieldName(tableName, camelCase)}${modelString}`;
}

/**
 * Get default value
 * @param {object} field field
 * @param {string} dialect -dialect
 */
function getDefaultValue(field, dialect, sequelizeNamespace) {
  sequelizeNamespace = sequelizeNamespace ? `${sequelizeNamespace}` : 'sequelize'

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
      defaultValue = `${sequelizeNamespace}.fn('${field.defaultValue.replace(
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
        defaultValue = `${sequelizeNamespace}.literal('${field.defaultValue}')`;
      }
    }
  }

  if (dialect === 'postgres' && regexpPostgresAutoIncrementValue.test(field.defaultValue)) {
    // If dialect is postgres and the field is auto increment, set default value null
    defaultValue = null;
  }

  return defaultValue;
}

function getAutoIncrement(field, dialect) {
  // postgres use serial to create auto-increment column: nextval(${table}_${field_seq::regclass)
  if (dialect === 'postgres' && regexpPostgresAutoIncrementValue.test(field.defaultValue)) {
    return true;
  }
  if (_.isBoolean(field.autoIncrement)) {
    return field.autoIncrement;
  }
  return false;
}

/**
 * Get data type
 * @param {object} field table field
 * @return {string}
 */
function getDataType(field, sequelizeNamespace) {
  sequelizeNamespace = sequelizeNamespace ? `${sequelizeNamespace}.` : ''

  if (field.type.indexOf('ENUM') === 0) {
    return `${sequelizeNamespace}DataTypes.${field.type}`;
  }

  const attr = (field.type || '').toLowerCase();

  if (attr === 'boolean' || attr === 'bit(1)' || attr === 'bit') {
    return `${sequelizeNamespace}DataTypes.BOOLEAN`;
  }

  const length = attr.match(/\(\d+\)/);
  const typeLength = !_.isNull(length) ? length : '';
  if (attr.match(/^(smallint|mediumint|tinyint|int)/)) {
    const typeInt = attr.match(/^bigint/) ? 'BIGINT' : 'INTEGER';

    let type = `${sequelizeNamespace}DataTypes.${typeInt}${typeLength}`;
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
    let type = `${sequelizeNamespace}DataTypes.BIGINT`;
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

  if (attr.match(/^(varchar|nvarchar)/)) {
    return `${sequelizeNamespace}DataTypes.STRING${typeLength}`;
  }

  if (attr.match(/^char/)) {
    return `${sequelizeNamespace}DataTypes.CHAR${typeLength}`;
  }

  if (attr.match(/^real/)) {
    return `${sequelizeNamespace}DataTypes.REAL`;
  }

  if (attr.match(/text|ntext$/)) {
    return `${sequelizeNamespace}DataTypes.TEXT`;
  }

  if (attr === 'date') {
    return `${sequelizeNamespace}DataTypes.DATEONLY`;
  }

  if (attr.match(/^(date|timestamp)/)) {
    return `${sequelizeNamespace}DataTypes.DATE`;
  }

  if (attr.match(/^(time)/)) {
    return `${sequelizeNamespace}DataTypes.TIME`;
  }

  if (attr.match(/^(float|float4)/)) {
    return `${sequelizeNamespace}DataTypes.FLOAT`;
  }

  if (attr.match(/^decimal/)) {
    return `${sequelizeNamespace}DataTypes.DECIMAL`;
  }

  if (attr.match(/^(float8|double precision|numeric)/)) {
    return `${sequelizeNamespace}DataTypes.DOUBLE`;
  }

  if (attr.match(/^uuid|uniqueidentifier/)) {
    return `${sequelizeNamespace}DataTypes.UUIDV4`;
  }

  if (attr.match(/^jsonb/)) {
    return `${sequelizeNamespace}DataTypes.JSONB`;
  }

  if (attr.match(/^json/)) {
    return `${sequelizeNamespace}DataTypes.JSON`;
  }

  if (attr.match(/^geometry/)) {
    return `${sequelizeNamespace}DataTypes.GEOMETRY`;
  }

  return attr;
}

/**
 * Process a table
 * @param {object} params { structures, allIndexes, foreignKeys, options: { camelCase, dialect } }
 * @return {object} { attributes: { filed: { attribute } }, indexes: [{ name, type, fields }] }
 */
function processTable({
  sequelizeNamespace,
  structures,
  allIndexes,
  foreignKeys,
  noModelSuffix,
  options,
}) {
  const { camelCase, dialect } = options;
  const attributes = {};
  _.forEach(structures, (structure, fieldName) => {
    const key = getFieldName(fieldName, camelCase);
    attributes[key] = _.cloneDeep(structure);
    attributes[key].field = fieldName;
    attributes[key].type = getDataType(structure, sequelizeNamespace);
    attributes[key].defaultValue = getDefaultValue(structure, dialect, sequelizeNamespace);
    attributes[key].autoIncrement = getAutoIncrement(structure, dialect);
  });

  const indexes = [];
  _.forEach(allIndexes, (index) => {
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
      indexes.push({
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
      model: getModelName(referencedTableName, camelCase, noModelSuffix),
    };
  });

  return { attributes, indexes };
}

/**
 * Get model definitions
 * @param {object} tables { structures, indexes, foreignKeys }
 * @param {object} options { camelCase, fileNameCamelCase }
 * @return {object} [{ modelName, modelFileName, tableName, attributes, indexes }]
 */
function getModelDefinitions(tables, options) {
  const { sequelizeNamespace, camelCase, noModelSuffix, fileNameCamelCase, fileNameMatchModel, dialect, } = options || {};
  const definitions = _.map(tables, (table, tableName) => {
    const { attributes, indexes } = processTable({
      sequelizeNamespace: sequelizeNamespace,
      structures: table.structures,
      allIndexes: table.indexes,
      foreignKeys: table.foreignKeys,
      noModelSuffix: noModelSuffix,
      options: { camelCase, dialect },
    });

    const modelName = getModelName(tableName, camelCase, noModelSuffix);
    const modelFileName = fileNameMatchModel ? modelName : getFieldName(tableName, fileNameCamelCase);
    return {
      modelName,
      modelFileName,
      tableName,
      attributes,
      indexes,
    };
  });

  return definitions;
}

module.exports = {
  getDefaultValue,
  getDataType,
  getModelDefinitions,
};
