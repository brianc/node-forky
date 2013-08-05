var helper = require('./');
var assert = require('assert');
var forky = require('../');
var async = require('async');
var ok = require('okay');

var repeat = 50;
var master = forky(helper.serverPath, function(err, master) {
  var hit = function(path, statusCode) {
    return function (cb) {
      var go = function(n, next) {
        helper.slam(path, statusCode, next);
      }
      async.times(repeat, go, cb);
    };
  };

  var actions = [
    hit('/', 200),
    hit('/disconnect', 200),
    hit('/crash', 500)
  ];

  async.parallel(actions, ok(function() {
    master.disconnect();
  }));
});
