var helper = require('./');
var forky = require('../');
var assert = require('assert');

var master = forky({
  path: helper.serverPath,
  enable_logging: true,
  callback: function(err, master) {
    console.log('workers listening');
    helper.slam('/exit', 200, function(err) {
      assert.ifError(err);
      master.disconnect();
    });
  }
});
