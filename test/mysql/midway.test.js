const fs = require("fs");
const path = require("path");
const Automate = require("../../index");
const config = require("../fixtures/definitions/config");

function getCodes(name) {
  const codes = fs
    .readFileSync(
      path.resolve(
        __dirname,
        `../fixtures/mysql/models/midway/${name}.json`
      )
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/mysql/midway.test.js", () => {
  describe("run()", () => {
    test("type: midway", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "midway"
        })
      );
      const codes = await automate.run();
      const expected = getCodes("default");
      expect(codes).toEqual(expected);
    });

    test("type: midway, camelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "midway",
          camelCase: true
        })
      );
      const codes = await automate.run();
      const expected = getCodes("camelCase");
      expect(codes).toEqual(expected);
    });

    test("type: midway, fileNameCamelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "midway",
          fileNameCamelCase: true,
        })
      );
      const codes = await automate.run();
      const expected = getCodes("fileNameCamelCase");
      expect(codes).toEqual(expected);
    });

    test("type: midway, tables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "midway",
          tables: ["user"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });

    test("type: midway, skipTables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "midway",
          skipTables: ["user_post"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });
  });
});
