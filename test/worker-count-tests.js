var helper = require('./');
var forky = require('../');
var request = require('request');
var cluster = require('cluster')
var assert = require('assert')

var master = forky({
  path: helper.serverPath,
  workers: 10,
  enable_logging: true,
  callback: function(err, master) {
    assert.equal(Object.keys(cluster.workers).length, 10)
    master.disconnect(function() {
      
    })
  }
})
