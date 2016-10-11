var JSONP = require("lib/jsonp");

module.exports = {
  storeLocation: function(longitude, latitude, callback) {
    var parameters = "longitude=" + encodeURIComponent(longitude) + "&latitude=" + encodeURIComponent(latitude);
    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId + "&" + parameters;

    JSONP(requestUrl, function() {

    });
  };
};
