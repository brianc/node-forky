## examples

### learn

Read [server.js](https://github.com/brianc/node-forky/blob/master/examples/server.js) for some reference implementations on how to do various things with forky and the cluster module.

### install & run

clone the repo
`npm install`
`node examples/master`

### test

You can hit routes to cause the server to do various production-style errors and disconnections.  Try it out with cURL.

Just get a 200 response with the id of the worker
`curl http://localhost:8485/`

Tell the worker to disconnect gracefully
`curl http://localhost:8485/disconnect`

Tell the worker to disconnect graefully and for an exit after a timeout
`curl http://localhost:8485/disconnect/10000`

Tell the worker to `process.exit()`
`curl http://localhost:8485/exit`

Tell the worker to throw an error (handled by the domain middleware)
`curl http://localhost:8485/crash`
