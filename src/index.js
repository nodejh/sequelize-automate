const assert = require('assert');
const _ = require('lodash');
const Sequelize = require('sequelize');
const debug = require('debug')('sequelize-automate');
const { getModelDefinitions } = require('./util/definition');
const generate = require('./generate');
const { write } = require('./util/write');

class Automate {
  constructor(database, username, password, options) {
    debug('sequelize-automate constructor');
    this.options = options;
    // https://sequelize.org/v5/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
    this.sequelize = new Sequelize(database, username, password, options || {});
    this.queryInterface = this.sequelize.getQueryInterface();
  }

  async getTableNames({ tables, skipTables }) {
    // TODO: check all dialects https://github.com/sequelize/sequelize/issues/11451
    const tableNames = await this.queryInterface.showAllTables();
    const allTables = _.map(tableNames, (tableName) => (
      _.isPlainObject(tableName) ? tableName.tableName : tableName
    ));

    if (_.isArray(tables)) {
      tables.map((table) => assert(allTables.includes(table), `Table: ${table} not exist.`));
      return tables;
    }

    if (_.isArray(skipTables)) {
      skipTables.map((table) => assert(allTables.includes(table), `Table: ${table} not exist.`));
      return _.difference(allTables, skipTables);
    }

    return allTables;
  }


  /**
   * Get all tables
   * @param {object} options { tables, skipTables }
   */
  async getTables(options) {
    const tableNames = await this.getTableNames({
      tables: options.tables,
      skipTables: options.skipTables,
    });

    debug('tableNames: ', tableNames);
    const tableStructures = await Promise.all(tableNames.map(
      (tableName) => this.queryInterface.describeTable(tableName),
    ));

    const tableIndexs = await Promise.all(tableNames.map(
      (tableName) => this.queryInterface.showIndex(tableName),
    ));

    const tableForeignKeys = await Promise.all(tableNames.map(
      (tableName) => this.queryInterface.getForeignKeyReferencesForTable(tableName),
    ));

    const tables = {};
    tableNames.forEach((tableName, i) => {
      tables[tableName] = {
        structures: tableStructures[i],
        indexs: tableIndexs[i],
        foreignKeys: tableForeignKeys[i],
      };
    });

    this.sequelize.close();
    debug('sequelize close');
    return tables;
  }

  async getDefinitions(options) {
    const {
      tables,
      skipTables,
      camelCase,
      modelFileNameCamelCase,
    } = options;
    const allTables = await this.getTables({
      tables,
      skipTables,
    });
    const definitions = getModelDefinitions(allTables, {
      camelCase,
      modelFileNameCamelCase,
      dialect: this.options.dialect,
    });
    debug('get model definitions');
    return definitions;
  }


  /* eslint-disable max-len */
  /**
   * getTables
   * @param {object} options
   * @param {array} [options.tables=null] use these tables.
   * @param {array} [options.skipTables=null] skip these tables.
   * @param {boolean} [options.camelCase=false] table field camel case, default is table field.
   * @param {boolean} [options.modelFileNameCamelCase] model file name camel case, default is table name.
   * @param {string} [options.dir='./models'] what directory to place the models.
    * @param {string} [options.typesDir=dir] what directory to place the models' definitions (for typescript), default is the same with dir.
   * @param {boolean} [options.reset=false] remove dir and typesDir, default is false.
   * @param {string} [options.type='js'] js,ts,egg,midway,@ali/midway
   * @param {string} [options.tsNoCheck=false] whether add @ts-nocheck to model files
   */
  async run(options) {
    /* eslint-enable */
    const {
      tables = null,
      skipTables = null,
      camelCase = false,
      modelFileNameCamelCase = false,
      dir = './models',
      reset = false,
      type = 'js',
      tsNoCheck = false, // @ts-nocheck
    } = options || {};
    const typesDir = options.typesDir || dir;

    const supportTypes = ['midway', '@ali/midway'];
    assert(_.isNull(tables) || _.isArray(tables), 'Invalid params table');
    assert(_.isNull(skipTables) || _.isArray(skipTables), 'invalid params table');
    assert(_.isBoolean(camelCase), 'Invalid params camelCase');
    assert(_.isBoolean(modelFileNameCamelCase), 'Invalid params modelFileNameCamelCase');
    assert(_.isString(dir), 'Invalid params dir');
    assert(_.isBoolean(reset), 'Invalid params reset');
    assert(supportTypes.includes(type), 'type not support');

    const definitions = await this.getDefinitions({
      tables,
      skipTables,
      camelCase,
      modelFileNameCamelCase,
    });

    const codes = generate(definitions, {
      type,
      tsNoCheck,
    });
    if (dir) {
      await write(codes, { dir, typesDir });
    }
    return codes;
  }
}

module.exports = Automate;
