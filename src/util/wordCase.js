const _ = require('lodash');

function bigCamelCase(string) {
  const str = _.camelCase(string);
  return `${str.charAt(0).toUpperCase()}${str.substr(1, str.length)}`;
}


module.exports = {
  bigCamelCase,
};
