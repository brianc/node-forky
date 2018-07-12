var helper = require('./')
var forky = require('../')
var request = require('request')

var master = forky({
  path: helper.serverPath,
  enable_logging: true,
  callback: function(err, master) {
    master.on('fork', function() {
      for (var id in master.workers) {
        console.log(master.workers[id].state)
      }
      master.disconnect(function() {
        console.log('disconnected')
      })
    })
    request.get('http://localhost:8485/crash', function() {})
  },
})
