var JSONP = function(url, callback) {
  var timestamp = new Date().getTime();
  var generatedFunction = "glmrjsonp" + Math.round(timestamp + Math.random() * 1000001);

  var jsonpScript = window.document.createElement("script");

  window[generatedFunction] = function(json) {
    callback(json);

    try {
      delete window[generatedFunction];
    } catch (e) {
      window[generatedFunction] = undefined;
    }

    try {
      jsonpScript.parentNode.removeChild(jsonpScript);
    } catch (e) {}
  };

  url += (url.indexOf("?") === -1) ? "?" : "&";
  url += "callback=" + generatedFunction;

  if (typeof jsonpScript.addEventListener === "function") {
    jsonpScript.addEventListener("error", function() {
      callback(false);
    }, false);
  }
  jsonpScript.setAttribute("src", url);
  window.document.getElementsByTagName("head")[0].appendChild(jsonpScript);
};

module.exports = JSONP;
