var fs = require('fs');
var RedisLuaHelper = require('redis-lua-helper');
var rlh = RedisLuaHelper({
    'root':         __dirname + '/scripts',
    'macro':        '#include',
    'extension':    'lua',
    'encoding':     'utf8'
});

var scripts_to_load = ['session.lua', 'sset.lua'];
rlh.load(scripts_to_load, function (err, scripts) {
  console.log(err);
  console.log(scripts); 

  if (!err) {
    for (var idx in scripts_to_load) {
      var script_name = scripts_to_load[idx];
      var write_file_name = 'compiled/' + script_name;
      (function(s,f) {
        fs.writeFile(f, rlh.code(s), function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("The file " + f + " was saved!");
            console.log("Code sha:" + rlh.shasum(s) + " for script " + s);
          }
        });
      })(script_name, write_file_name);
    }
  }
});

