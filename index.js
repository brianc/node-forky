var cluster = require('cluster');
var os = require('os');

var shuttingDown = false;

var killTimeout = function(worker, timeout) {
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
var forkWorker = function() {
  if(shuttingDown) return;
  var worker = cluster.fork();
  forky.log('forked worker', worker.id);
  //set up a listener for the disconnect message
  //a worker can send this by calling `forky.disconnect([timeout])`
  worker.once('message', function(msg) {
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
    killTimeout(worker, 1000);
  });
};

forky = module.exports = function(path, workerCount, cb) {
  if(typeof workerCount == 'function') {
    cb = workerCount
    workerCount = os.cpus().length
  }
  cluster.setupMaster({
    exec: path
  });
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
}

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
};
