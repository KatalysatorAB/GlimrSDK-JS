var express = require('express');
var app = express();

var fs = require("fs");

app.get('/v:version/iptags/:id/', function (req, res) {
  var file = req.params.id;

  var contents = fs.readFileSync(__dirname + "/../spec/mock_responses/" + file + ".json").toString();
  var callback = req.query.callback;

  if (callback) {
    res.send(callback + "(" + contents + ")");
  } else {
    res.send(contents);
  }
});

app.listen(51115, function () {
  console.log('Test server running... http://localhost:51115');
});
