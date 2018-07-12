var helper = require('./')
var forky = require('../')
var async = require('async')

var repeat = 50
forky({
  path: helper.serverPath,
  enable_logging: true,
  callback: function(err, master) {
    var hit = function(path, statusCode) {
      return function(cb) {
        function go(_, next) {
          helper.slam(path, statusCode, () => next())
        }
        async.times(repeat, go, cb)
      }
    }

    var actions = [hit('/', 200), hit('/disconnect', 200), hit('/crash', 500)]

    async.parallel(actions, err => {
      master.disconnect()
      if (err) {
        throw err
      }
    })
  },
})
