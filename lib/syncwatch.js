var sftp = require('./sftp.js');
var chokidar = require('chokidar');
var fs = require('fs');

var auth = {
    "keyPath": "~/.ssh/id_rsa"
  }
  
function watch(){
  var clargs = parseArgs();
  
  clargs.host = clargs.host.split('@');
  auth.username = clargs.host[0];
  auth.host = clargs.host[1];
  
  // load keyFile
  unixPathToWindows(auth.keyPath, function(err, path){
    if(err) return cb(err);
    auth.privateKey = fs.readFileSync(path);
    console.log('key Succesfully Found');

    function fileUpload(task, cb){
      var path = task.path, stat = task.stat;
      var absRemoteFilePath = require('path').posix.join(clargs.remotePath, path.slice(absLocalPath.length+1).replace('\\','/'));
      if(stat.isDirectory()){
        console.log('====mkDir===',path, 'TO', absRemoteFilePath);
        sftp.mkdir(auth, absRemoteFilePath, function(err){
          if(err) {
            console.error('mkdir Failed(already exists?)', absRemoteFilePath, err);
            cb(null);
          }
          cb(null);
        });
        return;
      }
      if(task.onlyDirs) return process.nextTick(cb);
      
      console.log('====fileUpload===',path, 'TO', absRemoteFilePath);
      sftp.getRemoteWriteFileStream(auth, absRemoteFilePath, function(err, stream){
        if(err) {
          console.error('getRemoteWriteFileStream Failed', err);
          return cb(new Error('getRemoteWriteFileStream Failed', err));
        }
        stream.on('error', function(err){
          cb(new Error('getRemoteFS failed', err));
        })
        var readstream = fs.createReadStream(path);
        readstream.on('end', function(){
          cb(null);
        })
        readstream.pipe(stream);
      })
    }
    var queue = [], processing = false;;
    function queueupload(path, stat){
      queue.push({path:path, stat:stat, onlyDirs:onlyDirs});
      tryProcessQueue();
    }
    function tryProcessQueue(){
      if(processing) return;
      var task = queue.shift();
      if(!task) return;
      processing = true;
      fileUpload(task, function(err, res){
        if(err) throw err;
        processing = false;
        tryProcessQueue();
      })
    }
    
    var absLocalPath = require('path').resolve(clargs.localPath);
    
    var watcher = chokidar.watch(absLocalPath, {ignoreInitial: false});
    var onlyDirs = true;
    watcher.on('add', queueupload);
    watcher.on('change', queueupload);
    watcher.on('addDir', queueupload);
    watcher.on('ready', function() { 
      onlyDirs = false;
    })
  });
}


function parseArgs(){
  var opts = {
    localPath:'.',
    remotePath:'',
    host:''
  };
  var args = process.argv.slice(2);
  var propOrder = ['localPath', 'host', 'remotePath']
  while(args.length > 0){
    var arg = args.shift()
    switch(arg){
      default:
        opts[propOrder.shift()] = arg;
    }
  }
  
  return opts;
}


function unixPathToWindows(path, cb){
  require('./command.js')('cygpath '+path+' -wa', function(err, path){
    if(err) return cb(err);
    cb(null, path.replace('\n',''));
  });
}


exports.watch = watch;