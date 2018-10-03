node-forky
==========

[![Build Status](https://travis-ci.org/brianc/node-forky.svg?branch=master)](https://travis-ci.org/brianc/node-forky)

Forky makes using the cluster module easier without preventing you from using it directly.

__Problem__: using `require('cluster')` properly is difficult, error prone, and hard to test.  
__Solution__: 


__master.js__
```js
var forky = require('forky');
forky({path: __dirname + '/worker.js'});
```

__worker.js__
```js
var http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end('Hello from worker ' + require('cluster').worker.id);
});
```

__bash__
```bash
$ node master
```

##### For a more complete example please check out the [detailed example implementation](https://github.com/brianc/node-forky/tree/master/examples)

## installation

`npm install forky`

## usage

Forky is meant to work with your existing http server without modifying the server.  
To take advantage of a multi-core system create a new file called `master.js` and require forky:

__master.js__
```js
var forky = require('forky');
```

Once this file is created, call forky by passing it the file path to your existing http server or your old _entry point_ to your application.

_example: if you used to type `node index.js` to start your application, your master.js file should look like this_

__master.js__
```js
var forky = require('forky');
forky({path: __dirname + '/index.js'});
```

What forky will do is spawn a number of workers equal to the number of cores you have available on your system.  
If one of these workers disconnects for __any reason__ due to a process.uncaughtException or even a `kill -9 <pid>` to the worker process, forky will spawn a new worker immedately.  
After forky has spawned a new worker it will attempt to gracefully shut down your disconnected worker.  After a timeout if your disconnected worker is still running, forky will forcefully kill it.


The best way to handle unexpected errors in node is to shut down your process and spawn a new one. Forky makes clean process shutdown & respawn easy as pie.

Let's implement an http server in node that throws an uncatchable exception.

__index.js__
```js
var http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end('everything is groovy');
  setTimeout(function() {
    throw new Error("This will crash your node process");
  }, 1000);
});
```

Now if someone hits our server, 1 second later the server will crash. The easy __but wrong__ way to handle this is by adding a `process.on('uncaughtException')` handler and just keep going forward as if nothing has happend:

__index.js__
```js
var http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end('everything is groovy');
  setTimeout(function() {
    throw new Error("This will crash your node process");
  }, 1000);
});

process.on('uncaughtException', function(err) {
  //log the error
  console.error(err);
  //continue on as if nothing has happend...
  //but something HAS happened.  What if the error wasn't in a timeout?
  //what if our error came from somewhere deep down and left some dangling
  //uncloses sockets or connections to database or open files?  We could be leaking
  //resources slowly and not even know it. oh no!
});
```

Instead of doing that let's use our `master.js` file we created above and modify our worker to _gracefully disconnect_ to cleanup the problems caused by the unexpected error:


__index.js__
```js
var http = require('http');
http.createServer(function(req, res) {
  res.writeHead(200, {'content-type': 'text/html'});
  res.end('everything is groovy');
  setTimeout(function() {
    throw new Error("This will crash your node process");
  }, 1000);
});

process.on('uncaughtException', function(err) {
  //log the error
  console.error(err);
  //let's tell our master we need to be disconnected
  require('forky').disconnect();
  //in a worker process, this will signal the master that something is wrong
  //the master will immediately spawn a new worker
  //and the master will disconnect our server, allowing all existing traffic to end naturally
  //but not allowing this process to accept any new traffic
});
```

All of the above is to help with graceful shutdowns.  Forky doesn't actually need you to signal disconnect from your workers. You can just let the exception crash the process, you can call `process.exit()`, or do anything else you want to clean up. Once your worker closes, regardless of the reason, forky will spawn a new one.

### Options

can take several options in addition to the file path:

* `path` - The path to the file to launcher for workers
* `workers` - The number of workers to launch (default: the number of cores)
* `callback` - A callback to call when forky has launched the workers
* `enable_logging` - Whether to enable forky logging (default: `false`)
* `kill_timeout` - The kill timeout (milliseconds) to use if a worker does not kill shutdown properly and is not given a timeout when it is told to disconnect (default: `1000`)
* `scheduling_policy`` - The scheduling policy to use for cluster.

## Contributing

I love contributions.  If you'd like to contribute a bug fix, send in yer pull requests!  

If you want to add a more substantial feature open an issue, and let's discuss it. We can turn that issue into a pull request and get new features added. Open Source Is Awesome. :+1:

Due to the race-condition type nature of managing a cluster of workers the tests don't use a test framework, they just batter the hell out of the example server and make sure it never returns an unexpected result.  To run the tests just type `make` after cloning & doing an `npm install`
## License

Copyright (c) 2013 Brian M. Carlson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
