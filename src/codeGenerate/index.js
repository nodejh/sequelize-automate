const generateMidway = require('./midway');

function generate(definitions, type) {
  switch (type) {
    case 'midway':
      generateMidway(definitions);
      break;
    default:
      break;
  }
}

module.exports = generate;
