var objecttools = {
  flattenObjectIntoArray: function(obj) {
    var ret = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        var data = obj[key];

        if (typeof data === "object" && data.constructor === Array) {
          for (var i = 0, j = data.length; i < j; i += 1) {
            ret.push(data[i]);
          }
        } else if (typeof data === "object") {
          ret = ret.concat(objecttools.flattenObjectIntoArray(data));
        } else {
          ret.push(data);
        }
      }
    }
    return ret;
  }
};

module.exports = objecttools;
