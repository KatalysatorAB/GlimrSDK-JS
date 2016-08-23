var testem = require("testem");

var server = require("./server");
console.log(__dirname + "/../testem.json");
var api = new testem();
api.startCI({
  file: __dirname + "/../testem.json"
});
