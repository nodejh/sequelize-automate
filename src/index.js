const assert = require('assert');
const _ = require('lodash');
const Sequelize = require('sequelize');
const debug = require('debug')('sequelize-automate');
const { getModelDefinitions } = require('./util/table');
const generate = require('./codeGenerate');

class Automate {
  constructor(database, username, password, options) {
    debug('sequelize-automate constructor');
    this.options = options;
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


  /**
   * getTables
   * @param {object} options
   * @param {array} [options.tables]
   * @param {array} [options.skipTables]
   * @param {array} [options.skipTables]
   * @param {boolean} [options.camelCase]
   * @param {boolean} [options.output]
   * @param {boolean} [options.dir]
   * @param {boolean} [options.typesDir]
   * @param {string} [options.type] js/ts/egg/midway/...
   * @param {string} [options.dir] js/ts/egg/midway/...
   */
  async run(options) {
    const {
      tables = null,
      skipTables = null,
      camelCase = false,
      output = false,
      type = 'js',
      dir,
      typesDir,
    } = options || {};
    const allTables = await this.getTables({
      tables,
      skipTables,
    });
    const definitions = getModelDefinitions(allTables, {
      camelCase,
    });
    debug('get model definitions');
    if (output) {
      generate(definitions, type, {
        dir,
        typesDir,
      });
    }
    return definitions;
  }
}

module.exports = Automate;
