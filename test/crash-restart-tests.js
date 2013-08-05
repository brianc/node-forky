var helper = require('./');
var assert = require('assert');
var forky = require('../');
var request = require('request');

var master = forky(helper.serverPath, function(err, master) {
  helper.slam('/crash', 500, function(err) {
    assert.ifError(err);
    master.disconnect();
  });
});
