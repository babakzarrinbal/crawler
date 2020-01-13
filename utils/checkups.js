const fs = require('fs');





(async ()=>{
  fs.readdirSync(
    // path.resolve(path.dirname(require.main.filename), filepath)
    '../'
    ).forEach(function(file) {
    let fullfile = path.resolve(
      path.dirname(require.main.filename),
      filepath,
      file
    );});

})()
