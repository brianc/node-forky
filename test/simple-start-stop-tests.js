var helper = require('./');
var forky = require('../');
var request = require('request');

var master = forky({
  path: helper.serverPath,
  enable_logging: true,
  callback: function(err, master) {
    master.disconnect(function() {
      console.log('disconnected');
    });
  }
});
