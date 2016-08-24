var testem = require("testem");

var server = require("./server");
var api = new testem();

if (process.argv[2] === "runner") {
  api.startDev({
    file: __dirname + "/../testem.json"
  });
} else {
  api.startCI({
    file: __dirname + "/../testem.json"
  });
}
