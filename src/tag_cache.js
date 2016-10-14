"use strict";

var md5 = require("./lib/md5");
var constants = require("./constants");
var GlimrSerialize = require("./serialize");

function missingParam(n, p) {
  return new TypeError("Parameter #" + n + " is required: " + p);
}

function TagCache(storage) {
  this.storage = storage;

  this.state = {
    urlCache: {},
    currentURLCacheKey: false
  };
}

TagCache.prototype = {
  usesTagCache: function() {
    return constants.CACHE_TIMINGS.tags > 0 && this.storage.isEnabled();
  },

  isTagCacheValid: function(pixelId) {
    if (!pixelId) {
      throw missingParam(0, "pixelId");
    }

    var lastUpdated = parseInt(this.storage.get("glimrTags_" + pixelId + "_lastUpdate"), 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.tags;
  },

  setTagCacheTimeInSeconds: function(seconds) {
    if (seconds > constants.MAX_CACHE_TIME) {
      seconds = constants.MAX_CACHE_TIME;
    }

    constants.CACHE_TIMINGS.tags = seconds;
  },

  getTagCacheTimeInSeconds: function() {
    return constants.CACHE_TIMINGS.tags;
  },

  currentURLIdentifier: function() {
    if (window.document.location.hash && window.document.location.hash.indexOf("#!") !== -1) {
      return window.document.location.hash.replace("#!", "");
    } else {
      return window.document.location.pathname;
    }
  },

  _currentURLCacheKey: function() {
    if (this.state.currentURLCacheKey) {
      return this.state.currentURLCacheKey;
    } else {
      return md5(this.currentURLIdentifier()).substr(0, 10);
    }
  },

  _unmarshalTags: function(tags) {
    if (!tags) {
      return {};
    }

    var allTags = tags.split("|");
    var cacheMap = {};
    for (var i = 0; i < allTags.length; i += 1 ) {
      var equalsPosition = allTags[i].indexOf("=");
      var name = allTags[i].substring(0, equalsPosition);
      cacheMap[name] = this._deserializeTags(allTags[i].substring(equalsPosition + 1));
    }
    return cacheMap;
  },

  _marshalTags: function(cache) {
    var cachePieces = [];
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        cachePieces.push(key.substr(0, 10) + "=" + this._serializeTags(cache[key]));
      }
    }
    return cachePieces.join("|");
  },

  _getOrUnmarshalCache: function(pixelId) {
    if (this.storage.isEnabled() && this.storage.get("glimrArticleTags_" + pixelId)) {
      this.state.urlCache[pixelId] = this._unmarshalTags(this.storage.get("glimrArticleTags_" + pixelId));
    }
    return this.state.urlCache[pixelId] || {};
  },

  _serializeTags: function(tags) {
    if (typeof tags === "object" && tags.constructor === Array) {
      return tags.join(",");
    } else {
      return constants.V2_PREFIX + GlimrSerialize.objectToQuery(tags);
    }
  },

  _deserializeTags: function(tagString) {
    tagString = tagString || "";

    if (tagString.substr(0, constants.V2_PREFIX.length) === constants.V2_PREFIX) {
      return GlimrSerialize.queryToObject(tagString.substr(constants.V2_PREFIX.length));
    } else {
      if (tagString === "") {
        return [];
      } else {
        return tagString.split(",");
      }
    }
  },

  _updateTagCache: function(pixelId, tags) {
    if (this.storage.isEnabled()) {
      this.storage.set("glimrTags_" + pixelId + "_lastUpdate", new Date().getTime());
      this.storage.set("glimrTags_" + pixelId, this._serializeTags(tags));
    }
  },

  _updateURLCache: function(pixelId, cache) {
    if (this.storage.isEnabled()) {
      this.storage.set("glimrArticleTags_" + pixelId, this._marshalTags(cache));
      this.storage.set("glimrArticleTags_" + pixelId + "_lastUpdate", new Date().getTime());
    }
    if (!this.state.urlCache[pixelId]) {
      this.state.urlCache[pixelId] = {};
    }
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        this.state.urlCache[pixelId][key.substr(0, 10)] = cache[key];
      }
    }
  }
};

module.exports = TagCache;
