"use strict";

var functools = require("./lib/functools");
var objecttools = require("./lib/objecttools");
var md5 = require("./lib/md5");
var JSONP = require("./lib/jsonp");

var GlimrSerialize = require("./serialize");
var constants = require("./constants");

function GlimrTags(storage, tagCache, glimrId, url, enrichment) {
  this.storage = storage;
  this.tagCache = tagCache;
  this.state = {
    loadingTags: {},
    loadedTags: {},
    currentURLCacheKey: false
  };
  this.networkRequests = 0;
  this.glimrId = glimrId;
  this.url = url;
  this.enrichment = enrichment;
}

GlimrTags.prototype = {
  getPixelLastUpdated: function(pixelId) {
    if (this.storage.isEnabled()) {
      return this.storage.get("glimrArticleTags_" + pixelId + "_lastUpdate") || false;
    } else {
      return false;
    }
  },

  getCachedURLTags: function(pixelId) {
    var cachedTags = this.tagCache._getOrUnmarshalCache(pixelId);
    var cacheKey = this.tagCache._currentURLCacheKey();

    if (!cachedTags[cacheKey]) {
      cachedTags[cacheKey] = [];
    }

    return cachedTags[cacheKey];
  },

  getCachedBehaviorTags: function(pixelId) {
    if (this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      return params[0];
    } else {
      return false;
    }
  },

  getCachedBehaviorTagsAndUpdateInBackground: function(pixelId, options) {
    options = options || {};
    options.onUpdate = typeof options.onUpdate === "function" ? options.onUpdate : function() {};

    if (!this.tagCache.usesTagCache()) {
      if (window.console) {
        window.console.error("Caching not enabled. Enable with Glimr.setTagCacheTimeInSeconds(number)");
      }
      return [];
    }

    var cachedTags = this._getLocalTags(pixelId);

    if (!this.tagCache.isTagCacheValid(pixelId)) {
      this.getTags(pixelId, options.onUpdate);
    }

    return cachedTags[0] || false;
  },

  getTagsAndPushToDataLayer: function(pixelId, callback) {
    this.getTags(pixelId, function(tags) {
      if (window.dataLayer && window.dataLayer.push) {
        window.dataLayer.push({
          "glimrTags": tags,
          "event": "glimr.tags"
        });
      }

      if (callback && typeof callback === "function") {
        callback();
      }
    });
  },

  getTags: function(pixelId, callback) {
    var pageCacheId = pixelId + this.tagCache._currentURLCacheKey();
    if (this.state.loadedTags[pageCacheId]) {
      var response = this.state.loadedTags[pageCacheId];
      callback(response[0], response[1]);
      return;
    }

    if (typeof this.state.loadingTags[pageCacheId] !== "undefined") {
      this.state.loadingTags[pageCacheId].push(callback);
      return;
    }

    this._requestTags(pixelId, pageCacheId, callback, functools.bindFunction(this, function(data) {
      var tags = [];
      var tagMappings = {};
      var toCache = tags;
      if (data && data.tags) {
        tags = data.tags;
        toCache = tags;
      }

      if (data && data.mapping) {
        tagMappings = data.mapping;
        toCache = tagMappings;
      }

      if (data && data.cache) {
        this.tagCache._updateURLCache(pixelId, data.cache);
      }

      if (this.tagCache.usesTagCache()) {
        this.tagCache._updateTagCache(pixelId, toCache);
      }

      var cachedTags = this.getCachedURLTags(pixelId);
      for (var i = 0; i < cachedTags.length; i += 1) {
        if (tags.indexOf(cachedTags[i]) === -1) {
          tags.push(cachedTags[i]);
          tagMappings.urlTags = tagMappings.urlTags || [];
          tagMappings.urlTags.push(cachedTags[i]);
        }
      }

      this.state.loadedTags[pageCacheId] = [tags, tagMappings];

      var callbacks = this.state.loadingTags[pageCacheId];
      delete this.state.loadingTags[pageCacheId];

      for (var j = 0; j < callbacks.length; j += 1) {
        callbacks[j](tags, tagMappings);
      }

      if (typeof data.id === "string" && data.id !== this.glimrId.getId()) {
        this.glimrId.setId(data.id);
      }
    }));
  },

  _getLocalTags: function(pixelId) {
    var storedTags = this.tagCache._deserializeTags(this.storage.get("glimrTags_" + pixelId));
    var urlTags = this.getCachedURLTags(pixelId);

    // v1
    if (typeof storedTags === "object" && storedTags.constructor === Array) {
      return [storedTags.concat(urlTags), {urlTags: urlTags}];
    } else {
      storedTags.urlTags = urlTags;

      var tagsArray = objecttools.flattenObjectIntoArray(storedTags);
      return [tagsArray, storedTags];
    }
  },

  _requestTags: function(pixelId, pageCacheId, userCallback, parseCallback) {
    var pixelLastUpdated = this.getPixelLastUpdated(pixelId);

    var extraParams = "";
    if (pixelLastUpdated) {
      extraParams += "&keywords_last_updated=" + pixelLastUpdated;
    }

    if (window.document.location.hash) {
      extraParams += "&fragment=" + encodeURIComponent(window.document.location.hash);
    }

    extraParams += "&" + GlimrSerialize.objectToQuery(this.enrichment._flush());

    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId.getId() + extraParams;

    if (this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      userCallback(params[0], params[1]);
      return;
    }

    this.state.loadingTags[pageCacheId] = [];
    this.state.loadingTags[pageCacheId].push(userCallback);

    this.networkRequests += 1;

    JSONP(requestUrl, parseCallback);
  }
};

module.exports = GlimrTags;
