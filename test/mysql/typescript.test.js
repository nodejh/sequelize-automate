const fs = require("fs");
const path = require("path");
const Automate = require("../../index");
const config = require("../fixtures/definitions/config");

function getCodes(name) {
  const codes = fs
    .readFileSync(
      path.resolve(
        __dirname,
        `../fixtures/mysql/models/typescript/${name}.json`
      )
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/mysql/typescript.test.js", () => {
  describe("run()", () => {
    test("type: ts", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "ts"
        })
      );
      const codes = await automate.run();
      const expected = getCodes("default");
      expect(codes).toEqual(expected);
    });

    test("type: ts, camelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "ts",
          camelCase: true
        })
      );
      const codes = await automate.run();
      const expected = getCodes("camelCase");
      expect(codes).toEqual(expected);
    });

    test("type: ts, fileNameCamelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "ts",
          fileNameCamelCase: true,
        })
      );
      const codes = await automate.run();
      const expected = getCodes("fileNameCamelCase");
      expect(codes).toEqual(expected);
    });

    test("type: ts, tables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "ts",
          tables: ["user"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });

    test("type: ts, skipTables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "ts",
          skipTables: ["user_post"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });
  });
});
