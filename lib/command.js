  
function command(cmd, cb){
  var spawn = require('child_process').spawn, result = '';
  var cmdProc = spawn('cmd.exe', ['/s', '/c', '"' + cmd + '"'],{ stdio: 'pipe', windowsVerbatimArguments: true });    
  cmdProc.stderr.on('data', function(err){cb&&cb(new Error(err)); cb=null;});
  cmdProc.stdout.on('data', function(res){ result += res; });
  cmdProc.on('close', function(code) {
    var error = null;
    if (code !== 0) cb && cb(new Error('exited with code ' + code));
    cb&&cb(null, result);
  });
}

module.exports = command;