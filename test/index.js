console.log(process.argv[1]);
var async = require('async');
var ok = require('okay')
var assert = require('assert');
var request = require('request');

var helper = module.exports = {
  serverPath: __dirname + '/../examples/server',
  get: function(path, cb) {
    var url = 'http://localhost:8485' + path;
    request.get(url, cb);
  },
  //gets the OK url a few times, and then calls
  //whatever url you pass, then OK a few more times
  slam: function(path, statusCode, cb) {
    var hit = function(cb) {
      var after = function(err) {
        setTimeout(function() {
          cb(err);
        }, 100)
      }
      setTimeout(function() {
        async.times(3, function(n, next) {
          helper.get('/', next);
        }, after);
      }, 100);
    }

    var disconnect = function(n, cb) {
      helper.get('/', ok(cb, function(res) {
        assert.equal(res.statusCode, 200);
        helper.get(path, ok(cb, function(res) {
          assert.equal(res.statusCode, statusCode);
          helper.get('/', ok(cb, function(res) {
            assert.equal(res.statusCode, 200);
            hit(cb);
          }));
        }));
      }));
    };
    async.timesSeries(10, disconnect, cb);
  }
}
