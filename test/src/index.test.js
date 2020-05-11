const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const Automate = require("../../index");
const config = require("../fixtures/definitions/config");

function getDefinitions(name) {
  const codes = fs
    .readFileSync(
      path.resolve(__dirname, `../fixtures/definitions/${name}.json`)
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/src/index.test.js", () => {
  describe("getDefinitions()", () => {
    test("should get table definitions", async () => {
      const automate = new Automate(config.dbOptions, config.options);
      const definitions = await automate.getDefinitions();
      const expected = getDefinitions("default");
      expect(definitions).toEqual(expected);
    });

    test("camelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        _.assign({}, config.options, {
          camelCase: true
        })
      );
      const definitions = await automate.getDefinitions();
      const expected = getDefinitions("camelCase");
      expect(definitions).toEqual(expected);
    });

    test("fileNameCamelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        _.assign({}, config.options, {
          fileNameCamelCase: true
        })
      );
      const definitions = await automate.getDefinitions();
      const expected = getDefinitions("fileNameCamelCase");
      expect(definitions).toEqual(expected);
    });

    test("tables: ['user']", async () => {
      const automate = new Automate(
        config.dbOptions,
        _.assign({}, config.options, {
          tables: ["user"]
        })
      );
      const definitions = await automate.getDefinitions();
      const expected = getDefinitions("user");
      expect(definitions).toEqual(expected);
    });

    test("skipTables: ['user_post']", async () => {
      const automate = new Automate(
        config.dbOptions,
        _.assign({}, config.options, {
          skipTables: ["user_post"]
        })
      );
      const definitions = await automate.getDefinitions();
      const expected = getDefinitions("user");
      expect(definitions).toEqual(expected);
    });
  });
});
