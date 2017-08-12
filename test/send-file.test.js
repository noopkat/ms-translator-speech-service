const test = require('tape');
const sendFile = require('../lib/send-file');

test('[send-file] returns error if file does not exist', function (t) {
  t.plan(1);
  sendFile('/path/to/fakefile.wav', function(error){
    t.ok(error, 'error');  
  });
});


