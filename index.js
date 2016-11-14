var cluster = require('cluster');
var os = require('os');

var shuttingDown = false;

var KILL_TIMEOUT = 1000;
var LOG = false;

function killTimeout(worker, timeout) {
  forky.log('setting kill timeout of', timeout, 'for worker', worker.id);
  var tid = setTimeout(function() {
    forky.log('worker', worker.id, 'did not shutdown after timeout', timeout, 'killing');
    worker.destroy();
  }, timeout);
  worker.once('exit', function() {
    forky.log('worker', worker.id, 'died. clear kill timeout');
    clearTimeout(tid);
  });
}

//fork a new worker
function forkWorker() {
  if(shuttingDown) return;
  var worker = cluster.fork();
  forky.log('forked worker', worker.id);
  //set up a listener for the disconnect message
  //a worker can send this by calling `forky.disconnect([timeout])`
  worker.on('message', function(msg) {
    if(msg.action != 'disconnect') return;
    forkWorker();
    worker.disconnect();

    if(!msg.timeout) return;
    killTimeout(worker, msg.timeout);
  });

  worker.once('disconnect', function() {
    forky.log('worker', worker.id, ' disconnected.', 'suicide', worker.suicide);
    if(worker.suicide) return;
    forkWorker();
    //set short kill timeout for unexpected worker shutdown
    killTimeout(worker, KILL_TIMEOUT);
  });
}

var forky = module.exports = function(options, workerCount, cb) {
  var path;
  if (typeof(options) === 'string') {
    // this is here for backwards compatibility to 0.1.2, remove this when we hit 1.0.0
    path = options;
    if(typeof workerCount == 'function') {
      cb = workerCount;
      workerCount = undefined;
    }
  }
  else {
    path = options.path;
    workerCount = options.workers;
    cb = options.callback;
    
    if (options.enable_logging !== undefined) {
      LOG = options.enable_logging;
    }
    if (options.kill_timeout !== undefined) {
      KILL_TIMEOUT = options.kill_timeout;
    }
  }
  
  if (undefined === workerCount) {
    workerCount = os.cpus().length;
  }

  // setup cluster if running with istanbul coverage
  if(cluster.isMaster && process.env.running_under_istanbul) {
    var istanbulOpts = options.istanbul || {};

    // use coverage for forked process
    // disabled reporting and output for child process
    // enable pid in child process coverage filename
    var commandArgs = ["cover", "--handle-sigint", "--report", "json", "--print", "none", "--include-pid", "--dir"];

    // set the istanbul coverage reporting directory
    commandArgs.push(istanbulOpts.coverageDir || "./coverage");

    if (istanbulOpts.srcRoot) {
      commandArgs.push("--root");
      commandArgs.push(istanbulOpts.srcRoot);
    }


    // add any exclusions specified for istanbul
    if(istanbulOpts.excludes && istanbulOpts.excludes.length) {
      istanbulOpts.excludes.forEach(function(exclude) {
        commandArgs.push("-x");
        commandArgs.push(exclude);
      });
    }

    // last arg is the actual worker process to instrument and then run
    commandArgs.push(path);

    cluster.setupMaster({
      exec: "./node_modules/.bin/istanbul",
      args: commandArgs
    });
  }
  else {
    cluster.setupMaster({
      exec: path
    });
  }

  forky.log('starting', workerCount, 'workers');
  for(var i = 0; i < workerCount; i++) {
    forkWorker();
  }

  var listeningWorkers = 0;
  cluster.on('listening', function(worker) {
    if(++listeningWorkers == workerCount) {
      cb ? cb(null, cluster) : function(){};
    }
  });
};

//call this from a worker to disconnect the worker
//forky will automatically spawn a new worker in its place
forky.disconnect = function(timeout) {
  if(!cluster.isWorker) {
    throw new Error("You are not a worker");
  }
  var worker = cluster.worker;
  if(worker.state == 'disconnecting') return;
  worker.state = 'disconnecting';
  worker.disconnectTimeout = timeout;
  forky.log('disconnecting worker', worker.id);
  if(timeout) {
    worker.send({action: 'disconnect', timeout: timeout});
  } else {
    worker.send({action: 'disconnect'});
  }
};

//this is a no-op but you can override it if you
//want some detailed log messages about what
//forky is doing with your workers
forky.log = function() {
    if (LOG) {
        console.log.apply(console, arguments);
    }
};
