const _ = require('lodash');

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

module.exports = {
  getDefaultValue,
  getDataType,
};
