const assert = require('assert');
const _ = require('lodash');
const Sequelize = require('sequelize');
const debug = require('debug')('sequelize-automate');
const { getModelDefinitions } = require('./util/definition');
const generate = require('./generate');
const { write } = require('./util/write');

class Automate {
  constructor(database, username, password, dbOptions, options) {
    debug('sequelize-automate constructor');
    // https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
    this.dbOptions = dbOptions || {};
    this.options = options || {};
    this.sequelize = new Sequelize(database, username, password, this.dbOptions);
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
   */
  async getTables() {
    const { options } = this;
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

  async getDefinitions() {
    const {
      tables,
      skipTables,
      camelCase,
      modelFileNameCamelCase,
    } = this.options;
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


  async run() {
    const {
      tables = null,
      skipTables = null,
      camelCase = false,
      modelFileNameCamelCase = false,
      dir = './models',
      reset = false,
      type = 'js',
      tsNoCheck = false, // @ts-nocheck
    } = this.options;
    const typesDir = this.options.typesDir || dir;

    const supportTypes = ['js', 'ts', 'egg', 'midway', '@ali/midway'];
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
