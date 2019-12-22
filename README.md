# Sequelize-Automate

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/nodejh/sequelize-automate.svg)](https://greenkeeper.io/)
[![Build Status](http://img.shields.io/travis/nodejh/sequelize-automate/master.svg)](https://travis-ci.org/nodejh/sequelize-automate)
[![Dependency Status](https://david-dm.org/nodejh/sequelize-automate.svg)](https://david-dm.org/nodejh/sequelize-automate)


<!-- [![Test Coverage](https://codeclimate.com/github/nodejh/sequelize-automate/badges/coverage.svg)](https://codeclimate.com/github/nodejh/sequelize-automate/coverage) -->

[npm-image]: https://img.shields.io/npm/v/sequelize-automate.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sequelize-automate
[travis-image]: https://img.shields.io/travis/nodejh/sequelize-automate.svg?style=flat-square
[travis-url]: https://travis-ci.org/nodejh/sequelize-automate
[codecov-image]: https://img.shields.io/codecov/c/github/nodejh/sequelize-automate.svg?style=flat-square
[codecov-url]: https://codecov.io/github/nodejh/sequelize-automate?branch=master
[david-image]: https://img.shields.io/david/nodejh/sequelize-automate.svg?style=flat-square
[david-url]: https://david-dm.org/nodejh/sequelize-automate
[snyk-image]: https://snyk.io/test/npm/sequelize-automate/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/sequelize-automate
[download-image]: https://img.shields.io/npm/dm/sequelize-automate.svg?style=flat-square
[download-url]: https://npmjs.org/package/sequelize-automate


Automatically generate models for [SequelizeJS](https://github.com/sequelize/sequelize) via the command line.

## Install

```shell script
$ npm install -g sequelize-automate
```

## Prerequisites

You will need to install the correct dialect binding globally before using sequelize-automate.

Example for MySQL/MariaDB

`npm install -g mysql`

Example for Postgres

`npm install -g pg pg-hstore`

Example for Sqlite3

`npm install -g sqlite`

Example for MSSQL

`npm install -g mssql`

## Usage

```shell script
[node] sequelize-automate -h <host> -d <database> -u <user> -x [password] -p [port]  --dialect [dialect] -c [/path/to/config] -o [/path/to/models] -t [tableName] -C

    Options:
      -h, --host        IP/Hostname for the database.   [required]
      -d, --database    Database name.                  [required]
      -u, --user        Username for database.
      -x, --pass        Password for database.
      -p, --port        Port number for database.
      -c, --config      JSON file for Sequelize's constructor "options" flag object as defined here: https://sequelize.readthedocs.org/en/latest/api/sequelize/
      -o, --output      What directory to place the models.
      -e, --dialect     The dialect/engine that you're using: postgres, mysql, sqlite
      -a, --additional  Path to a json file containing model definitions (for all tables) which are to be defined within a model's configuration parameter. For more info: https://sequelize.readthedocs.org/en/latest/docs/models-definition/#configuration
      -t, --tables      Comma-separated names of tables to import
      -T, --skip-tables Comma-separated names of tables to skip
      -C, --camel       Use camel case to name models and fields
      -n, --no-write    Prevent writing the models to disk.
      -s, --schema      Database schema from which to retrieve tables
      -z, --typescript  Output models as typescript with a definitions file.
```

<!-- ## Example -->
<!--
```shell script
$ sequelize-automate -o "./models" -d sequelize_auto_test -h localhost -u my_username -p 5432 -x my_password -e postgres
```

Produces a file/files such as ./models/Users.js which looks like:

```javascript
const { DataTypes } = require('sequelize');

module.exports = sequelize => {
  const attributes = {
    id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: 'id',
      unique: 'uk_id',
    },
    name: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: 'user name',
      field: 'name',
    },
    email: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: 'user email',
      field: 'name',
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: 'created time',
      field: 'created_at',
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: 'update time',
      field: 'updated_at',
    },
  };
  const options = {
    tableName: 'user',
    comment: 'user table',
    indexs: [{
      name: 'uk_name_email',
      unique: true,
      fields: [
        'name',
        'email',
      ],
    }]
  };

  const UserModel = sequelize.define('userModel', attributes, options);
  return UserModel;
};

```

Which makes it easy for you to simply [Sequelize.import](http://docs.sequelizejs.com/en/latest/docs/models-definition/#import) it.

## Configuration options

For the `-c, --config` option the following JSON/configuration parameters are defined by Sequelize's `options` flag within the constructor. For more info:

[https://sequelize.readthedocs.org/en/latest/api/sequelize/](https://sequelize.readthedocs.org/en/latest/api/sequelize/) -->

## Programmatic API

```js
const Automate = require('sequelize-automate')

// The database options are the same with sequelize constructor options.
// https://sequelize.org/master/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
const dbOptions = {
  database: 'test',
  username: 'root',
  password: 'root',
  dialect: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  define: {
    underscored: false,
    freezeTableName: false,
    charset: 'utf8mb4',
    timezone: '+00:00',
    dialectOptions: {
      collate: 'utf8_general_ci',
    },
    timestamps: false,
  },
};

// sequelize automate options
const options = {
  type: 'js', // Which code style want to generate, supported: js/ts/egg/midway. Default is `js`.
  camelCase: false, // Model name camel case. Default is false.
  fileNameCamelCase: true, // Model file name camel case. Default is false.
  dir: 'models', // What directory to place the models. Default is `models`.
  typesDir: 'models', // What directory to place the models' definitions (for typescript), default is the same with dir.
  tables: null, // Use these tables, Example: ['user'], default is null.
  skipTables: null, // Skip these tables. Example: ['user'], default is null.
  tsNoCheck: false, // Whether add @ts-nocheck to model files, default is false.
}

const automate = new Automate('database', 'user', 'password', dbOptions, options);

(async function main() {

  // get table definitions
  const definitions = await automate.getDefinitions();
  console.log(definitions);

  // generate codes
  const code = await automate.run();
  console.log(code);
})()
```


