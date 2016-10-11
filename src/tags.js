var functools = require("lib/functools");
var md5 = require("lib/md5");

var constants = require("./constants");

module.exports = {
  setTagCacheTimeInSeconds: function(seconds) {
    if (seconds > constants.MAX_CACHE_TIME) {
      seconds = constants.MAX_CACHE_TIME;
    }

    constants.CACHE_TIMINGS.tags = seconds;
  },

  getTagCacheTimeInSeconds: function() {
    return constants.CACHE_TIMINGS.tags;
  },

  currentURLCacheKey: function() {
    if (this.state.currentURLCacheKey) {
      return this.state.currentURLCacheKey;
    } else {
      return md5(this.currentURLIdentifier()).substr(0, 10);
    }
  },

  currentURLIdentifier: function() {
    if (window.document.location.hash && window.document.location.hash.indexOf("#!") !== -1) {
      return window.document.location.hash.replace("#!", "");
    } else {
      return window.document.location.pathname;
    }
  },

  getPixelLastUpdated: function(pixelId) {
    if (this.useLocalStorage) {
      return Storage["glimrArticleTags_" + pixelId + "_lastUpdate"] || false;
    } else {
      return false;
    }
  },

  getCachedURLTags: function(pixelId) {
    var cachedTags = this._getOrUnmarshalCache(pixelId);
    var cacheKey = this.currentURLCacheKey();

    if (!cachedTags[cacheKey]) {
      cachedTags[cacheKey] = [];
    }

    return cachedTags[cacheKey];
  },

  getCachedBehaviorTags: function(pixelId) {
    if (this.usesTagCache() && this.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      return params[0];
    } else {
      return false;
    }
  },

  getCachedBehaviorTagsAndUpdateInBackground: function(pixelId, options) {
    options = options || {};
    options.onUpdate = typeof options.onUpdate === "function" ? options.onUpdate : function() {};

    if (!this.usesTagCache()) {
      if (window.console) {
        window.console.error("Caching not enabled. Enable with Glimr.setTagCacheTimeInSeconds(number)");
      }
      return [];
    }

    var cachedTags = this._getLocalTags(pixelId);

    if (!this.isTagCacheValid(pixelId)) {
      this.getTags(pixelId, options.onUpdate);
    }

    return cachedTags[0] || false;
  },

  getTags: function(pixelId, callback) {
    var pageCacheId = pixelId + this.currentURLCacheKey();
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
        this._updateURLCache(pixelId, data.cache);
      }

      if (this.usesTagCache()) {
        this._updateTagCache(pixelId, toCache);
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

      if (typeof data.id === "string" && data.id !== this.glimrId) {
        this.glimrId = data.id;
        this.setGlimrCookie();
      }
    }));
  },

  _getLocalTags: function(pixelId) {
    var storedTags = this._deserializeTags(Storage["glimrTags_" + pixelId]);
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
    this.initGlimrId();

    var pixelLastUpdated = this.getPixelLastUpdated(pixelId);

    var extraParams = "";
    if (pixelLastUpdated) {
      extraParams += "&keywords_last_updated=" + pixelLastUpdated;
    }

    if (window.document.location.hash) {
      extraParams += "&fragment=" + encodeURIComponent(window.document.location.hash);
    }

    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId + extraParams;

    if (this.usesTagCache() && this.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      userCallback(params[0], params[1]);
      return;
    }

    this.state.loadingTags[pageCacheId] = [];
    this.state.loadingTags[pageCacheId].push(userCallback);

    this.networkRequests += 1;
    JSONP(requestUrl, parseCallback);
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

  usesTagCache: function() {
    return constants.CACHE_TIMINGS.tags > 0 && this.useLocalStorage;
  },

  isTagCacheValid: function(pixelId) {
    var lastUpdated = parseInt(Storage["glimrTags_" + pixelId + "_lastUpdate"], 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.tags;
  };
};
