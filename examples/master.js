var forky = require('../');

forky.log = function() {
  console.log.apply(console, arguments)
};

forky(__dirname + '/server');
