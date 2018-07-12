var express = require('express')
var domain = require('domain')
var cluster = require('cluster')
var forky = require('../')
var http = require('http')
var sliced = require('sliced')

var workerId = function() {
  if (cluster.isWorker) {
    return cluster.worker.id
  }
  return 'NON-CLUSTERED WORKER ???'
}

var log = function() {
  var args = sliced(arguments)
  args.unshift(workerId())
  console.log.apply(console, args)
}

var app = express()
//use simple domain middleware
//to automatically route all errors for a given request
//back to the express error handler
app.use(function(req, res, next) {
  var d = domain.create()
  d.on('error', next)
  d.add(req)
  d.add(res)
  d.run(next)
})

//add the router after the domain middleware
app.use(app.router)

//express error handler
//which will catch domain errors and respond nicely with a 500
//after the response, it will disconnect this worker gracefully
//meaning no more connections will be accepted and once the
//error connection terminates, the worker will die
app.use(function(err, req, res, next) {
  log('route error. disconnecting.')
  forky.disconnect()
  res.send(500, workerId() + ' request error')
})

//simple route just returning a 200 OK response
app.get('/', function(req, res, next) {
  res.send(workerId() + ' OK')
})

//throw an unhandled error which will be caught
//by express-domain-middleware
app.get('/crash', function(req, res, next) {
  process.nextTick(function() {
    throw new Error('PWND BROTHER')
  })
})

//the /exit route forces this process to exit once
//this response has completed
//forky will automatically respawn another process when this one dies
app.get('/exit', function(req, res, next) {
  res.on('finish', function() {
    console.log('res closed!')
    process.exit(0)
  })
  res.send(workerId() + ' exit')
})

//the /disconnect route will send the disconnect signal to forky
//this will behave in the same way as the express error handler above.
//no more requests will be handled on this worker and
//this worker will be allowed to gracefully die once all in-flight requests complete
app.get('/disconnect', function(req, res, next) {
  process.nextTick(function() {
    log(workerId() + ' disconnecting from master')
    res.send(workerId() + ' close')
    forky.disconnect()
  })
})

//in practice the worker process will likely have references keeping the event loop
//alive forever. These can be things like open database connections
//in a pool of connected clients or other long living timeouts.
//if you want to force a disconnection and total worker shutdown/cleanup
//after a specific timeout you can pass a timeout to disconnect.
//after this timeout forky will forcefully kill this worker if it hasn't
//already exited
app.get('/disconnect/:timeout', function(req, res, next) {
  var timeout = req.params.timeout
  setInterval(function() {
    console.log(workerId() + ' I am doing something in the background every so often...')
  }, 5000)
  forky.disconnect(timeout)
  res.send(workerId() + 'disconnecting in ' + timeout + ' miliseconds')
})

var server = http.createServer(app)

process.on('exit', function() {
  log('exit')
})

server.listen(8485, function() {
  log('listening on', 8485)
})

module.exports = server
