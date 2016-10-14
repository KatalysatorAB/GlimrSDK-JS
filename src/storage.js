"use strict";

var storage = require("./lib/storage");

function GlimrStorage(isEnabledCallback) {
  this._isEnabledCallback = isEnabledCallback;
}

GlimrStorage.prototype = {
  set: function(key, value) {
    storage[key] = value;
  },

  get: function(key) {
    return storage[key];
  },

  isEnabled: function() {
    return this._isEnabledCallback();
  }
};

GlimrStorage.isSupportedByBrowser = function() {
  return !!storage;
};

module.exports = GlimrStorage;
