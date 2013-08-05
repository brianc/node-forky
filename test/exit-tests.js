var helper = require('./');
var forky = require('../');
var assert = require('assert');

var master = forky(helper.serverPath, function(err, master) {
  console.log('workers listening');
  helper.slam('/exit', 200, function(err) {
    assert.ifError(err);
    master.disconnect();
  });
});
