const fs = require("fs");
const path = require("path");
const Automate = require("../../index");
const config = require("../fixtures/definitions/config");

function getCodes(name) {
  const codes = fs
    .readFileSync(
      path.resolve(
        __dirname,
        `../fixtures/mysql/models/egg/${name}.json`
      )
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/mysql/egg.test.js", () => {
  describe("run()", () => {
    test("type: egg", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "egg"
        })
      );
      const codes = await automate.run();
      const expected = getCodes("default");
      expect(codes).toEqual(expected);
    });

    test("type: egg, camelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "egg",
          camelCase: true
        })
      );
      const codes = await automate.run();
      const expected = getCodes("camelCase");
      expect(codes).toEqual(expected);
    });

    test("type: egg, fileNameCamelCase: true", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "egg",
          fileNameCamelCase: true,
        })
      );
      const codes = await automate.run();
      const expected = getCodes("fileNameCamelCase");
      expect(codes).toEqual(expected);
    });

    test("type: egg, tables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "egg",
          tables: ["user"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });

    test("type: egg, skipTables", async () => {
      const automate = new Automate(
        config.dbOptions,
        Object.assign({}, config.options, {
          type: "egg",
          skipTables: ["user_post"]
        })
      );
      const codes = await automate.run();
      const expected = getCodes("user");
      expect(codes).toEqual(expected);
    });
  });
});
