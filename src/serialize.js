"use strict";

var GlimrSerialize = {
  objectToQuery: function(dictionary, prefix) {
    prefix = prefix || "";

    var ret = [];
    for (var key in dictionary) {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        var value = dictionary[key];

        var keyPrefix;
        if (prefix.length) {
          keyPrefix = prefix + "[" + GlimrSerialize.escapeStringForQuery(key) + "]";
        } else {
          keyPrefix = GlimrSerialize.escapeStringForQuery(key);
        }

        if (typeof value === "object" && value.constructor === Array) {
          for (var i = 0, j = value.length; i < j; i += 1) {
            ret.push(keyPrefix + "=" + GlimrSerialize.escapeStringForQuery(value[i]));
            ret.push("&");
          }

          // Remove last &
          ret.pop();
        } else if (typeof value === "object") {
          ret.push(GlimrSerialize.objectToQuery(value, keyPrefix));
        } else {
          ret.push(keyPrefix + "=" + GlimrSerialize.escapeStringForQuery(value));
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
