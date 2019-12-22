const fs = require('fs');
const path = require('path');
const Automate = require('../../index');
const config = require('../fixtures/mysql/config');

function getCodes(name) {
  const codes = fs.readFileSync(path.resolve(__dirname, `../fixtures/mysql/models/${name}.json`))
    .toString();
  return JSON.parse(codes);
}


describe('test/mysql/index.test.js', () => {

  describe('run()', () => {
    test('type: js', async () => {
      const automate = new Automate(config.dbOptions, Object.assign({}, config.options, {
        type: 'js',
      }));
      const codes = await automate.run();
      const expected = getCodes('javascript');
      expect(codes)
        .toEqual(expected);
    });

    test('type: js, camelCase: true', async () => {
      const automate = new Automate(config.dbOptions, Object.assign({}, config.options, {
        type: 'js',
        camelCase: true,
      }));
      const codes = await automate.run();
      const expected = getCodes('javascript_camelCase');
      expect(codes)
        .toEqual(expected);
    });
  });
});