"use strict";

var GlimrSerialize = {
  objectToQuery: function(dictionary) {
    var ret = [];
    for (var key in dictionary) {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        var value = dictionary[key];

        if (typeof value === "object" && value.constructor === Array) {
          ret.push(GlimrSerialize.arrayToQuery(value, key));
        } else if (typeof key === "object") {
          ret.push(GlimrSerialize.objectToQuery(value));
        } else {
          ret.push(GlimrSerialize.escapeStringForQuery(key) + "=" + GlimrSerialize.escapeStringForQuery(value));
        }

        ret.push("&");
      }
    }

    // Remove last &
    ret.pop();

    return ret.join("");
  },

  arrayToQuery: function(arr, key) {
    key = key || "";
    var escapedKey = GlimrSerialize.escapeStringForQuery(key);

    var ret = [];
    for (var i = 0, j = arr.length; i < j; i += 1) {
      var value = GlimrSerialize.escapeStringForQuery(arr[i]);
      ret.push(escapedKey + "=" + value);
    }
    return ret.join("&");
  },

  queryToObject: function(str) {
    var ret = {};

    var arr = str.split("&");
    for (var i = 0, j = arr.length; i < j; i += 1) {
      var pieces = arr[i].split("=");

      var key = GlimrSerialize.unescapeStringForQuery(pieces[0] || "");
      var value = GlimrSerialize.unescapeStringForQuery(pieces[1] || "");

      if (typeof ret[key] === "undefined") {
        ret[key] = [];
      }

      if (value.length > 0) {
        ret[key].push(value);
      }
    }

    return ret;
  },

  escapeStringForQuery: function(str) {
    return encodeURIComponent(str);
  },

  unescapeStringForQuery: function(str) {
    return decodeURIComponent(str);
  }
};

module.exports = GlimrSerialize;
