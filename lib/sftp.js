
var Client = require('ssh2').Client;

var sftpCon, conn;

function getRemoteReadFileStream(auth, path, cb){
  getSftpConn(auth, function(err, sftp){
    if(err) return cb(err);
    cb(null, sftp.createReadStream(path));
  });
}

function getRemoteWriteFileStream(auth, path, cb){
  getSftpConn(auth, function(err, sftp){
    if(err) return cb(err);
    cb(null, sftp.createWriteStream(path));
  });
}

function getSftpConn(auth, cb){
  if(sftpCon) return process.nextTick(cb.bind(this, null, sftpCon))
  conn = new Client();
  conn.on('ready', function() {
     conn.sftp(function(err, sftp){
       if(err) return cb(err);
       sftpCon = sftp
       cb(null, sftp);
     });
  })
  conn.connect(auth);
}

function doListDir(auth, path, cb){
  getSftpConn(auth, function(err, sftp){
    if (err) return cb(err);
    sftp.readdir(path, function(err, list) {
      if (err) return cb(err);
      cb(null, list);
    });
    
  });
}

function mkdir(auth, path, cb) {
  getSftpConn(auth, function(err, sftp){
    if (err) return cb(err);
    sftp.mkdir(path, function(err) {
      if (err) return cb(err);
      cb(null);
    });
  });
}

['mkdir', 'rmdir', 'unlink'].forEach(function(name){
  exports[name] = function(auth, path, cb){
  getSftpConn(auth, function(err, sftp){
    if (err) return cb(err);
    sftp[name](path, function(err) {
      if (err) return cb(err);
      cb(null);
    });
  });
    
  }
})

function close(){
  conn&&conn.end();
  sftpCon = null;
  conn = null;
}

exports.getRemoteReadFileStream = getRemoteReadFileStream;
exports.getRemoteWriteFileStream = getRemoteWriteFileStream;
exports.doListDir = doListDir;
exports.mkdir = mkdir;
exports.close = close;