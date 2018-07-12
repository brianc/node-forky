var helper = require('./')
var assert = require('assert')
var forky = require('../')
var request = require('request')

var master = forky({
  path: helper.serverPath,
  enable_logging: true,
  callback: function(err, master) {
    helper.slam('/crash', 500, function(err) {
      assert.ifError(err)
      master.disconnect()
    })
  },
})
