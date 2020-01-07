const fs = require("fs");
const path = require("path");
const Automate = require("../../index");
const config = require("../fixtures/definitions/config");

function getCodes(name) {
  const codes = fs
    .readFileSync(
      path.resolve(
        __dirname,
        `../fixtures/mysql/models/javascript/${name}.json`
      )
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/mysql/javascript.test.js", () => {
  describe("run()", () => {
    test("type: js", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "js"
        })
      );
      const codes = await automate.run();
      const expected = getCodes("default");
      expect(codes).toEqual(expected);
    });

    test("type: js, camelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "js",
          camelCase: true
        })
      );
      const codes = await automate.run();
      const expected = getCodes("camelCase");
      expect(codes).toEqual(expected);
    });

    test("type: js, fileNameCamelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "js",
          fileNameCamelCase: true,
        })
      );
      const codes = await automate.run();
      const expected = getCodes("fileNameCamelCase");
      expect(codes).toEqual(expected);
    });

    test("type: js, tables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "js",
          tables: ["user"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });

    test("type: js, skipTables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "js",
          skipTables: ["user_post"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });
  });
});
