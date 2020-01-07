const fs = require("fs");
const path = require("path");
const Automate = require("../../index");
const config = require("../fixtures/postgres/config");

function getCodes(name) {
  const codes = fs
    .readFileSync(
      path.resolve(
        __dirname,
        `../fixtures/postgres/models/javascript/${name}.json`
      )
    )
    .toString();
  return JSON.parse(codes);
}

describe("test/postgres/javascript.test.js", () => {
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
  });
});
