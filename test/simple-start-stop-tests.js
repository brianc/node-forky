var helper = require('./');
var forky = require('../');
var request = require('request');

var master = forky(helper.serverPath, function(err, master) {
  master.disconnect(function() {
    console.log('disconnected');
  });
});
