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
  usesFallbackCache: function() {
    return constants.CACHE_TIMINGS.fallback > 0 && this.storage.isEnabled();
  },

  isTagCacheValid: function(pixelId) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    var lastUpdated = parseInt(this.storage.get("glimrTags_" + pixelId + "_lastUpdate"), 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.tags;
  },

  isFallbackTagCacheValid: function(pixelId) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    var lastUpdated = parseInt(this.storage.get("glimrTags_" + pixelId + "_fallbackInit"), 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.fallback;
  },

  setTagCacheTimeInSeconds: function(seconds) {
    if (seconds > constants.MAX_CACHE_TIME) {
      seconds = constants.MAX_CACHE_TIME;
    }

    constants.CACHE_TIMINGS.tags = seconds;
  },

  setTagCacheFallback: function(seconds, mapping) {
    if(seconds > constants.MAC_FALLBACK_TIME) {
      seconds = constants.MAC_FALLBACK_TIME;
    }

    constants.CACHE_TIMINGS.fallback = seconds;
    constants.FALLBACK_MAPPING = mapping;
    constants.IS_FALLBACK = true;
  },

  getTagCacheTimeInSeconds: function() {
    return constants.CACHE_TIMINGS.tags;
  },

  getFallbackTimeInSeconds: function() {
    return constants.CACHE_TIMINGS.fallback;
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


  _isFallbackValid: function (pixelId) {
    var lastUpdated = parseInt(this.storage.get("glimrTags_" + pixelId + "_fallbackInit"), 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.fallback;
  },

  _mapTagArrayToTagsObject: function (tags) {
    var mapped = {};

    for (var k = 0; k < tags.length; k += 1) {
      mapped['geo' + k] = [tags[k]];
    }
    return mapped;
  },
  _entries: function (obj) {
    var ownProps = Object.keys(obj),
        i = ownProps.length,
        resArray = new Array(i); // preallocate the Array

    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }

    return resArray;
  },

  _extractCode: function (tag, prefix) {
    return tag.substring(prefix.length, tag.length);
  },
  _extractPrefix: function (tag) {
    var prefixIndex = tag.indexOf('_');
    return tag.substring(0, prefixIndex + 1);
  },
  _prepareTagCacheForFallbackTags: function (pixelId, storedTags, incomingTags) {
    var rawIncomingTags = [];
    var rawIncomingTagPrefixes = [];
    var rawStoredTags = [];
    var rawStoredTagPrefixes = [];
    var incomingTagsEntries = this._entries(incomingTags);
    var storedTagsEntries = this._entries(storedTags);

    for (var j = 0; j < incomingTagsEntries.length; j+=1) {
      rawIncomingTags.push(incomingTagsEntries[j][1][0]);
      rawIncomingTagPrefixes.push(this._extractPrefix(incomingTagsEntries[j][1][0]));
    }

    for (var i = 0; i < storedTagsEntries.length; i+=1) {
      rawStoredTags.push(storedTagsEntries[i][1][0]);
      rawStoredTagPrefixes.push(this._extractPrefix(storedTagsEntries[i][1][0]));
    }

    if(!rawIncomingTags.length) {
      return this._mapTagArrayToTagsObject(rawStoredTags);
    }

    var mapping = constants.FALLBACK_MAPPING;

    if(!mapping) {
      throw new Error('Mapping is not provided');
    }

    for(var currentMappingIndex = 0; currentMappingIndex < mapping.length; currentMappingIndex += 1) {
      var currentMapping = mapping[currentMappingIndex];
      var firstMappingTag = currentMapping[0];
      var secondMappingTag = currentMapping[1];
      var firstTagBackend = '';
      var firstTagStored = '';
      var secondTagStored = '';
      var secondTagBackend = '';

      if(rawIncomingTagPrefixes.indexOf(firstMappingTag) < 0) {
        return this._mapTagArrayToTagsObject(rawStoredTags);
      }

      for (var rawIncomingTagIndex = 0; rawIncomingTagIndex < rawIncomingTagPrefixes.length; rawIncomingTagIndex += 1) {
        if(rawIncomingTagPrefixes[rawIncomingTagIndex] === firstMappingTag && !firstTagBackend) {
          firstTagBackend = rawIncomingTags[rawIncomingTagIndex];
        }

        if(rawIncomingTagPrefixes[rawIncomingTagIndex] === secondMappingTag && !secondTagBackend) {
          secondTagBackend = rawIncomingTags[rawIncomingTagIndex];
        }
      }

      for (var rawStoredTagIndex = 0; rawStoredTagIndex < rawStoredTags.length; rawStoredTagIndex += 1) {
        if(rawStoredTagPrefixes[rawStoredTagIndex] === firstMappingTag && !firstTagStored) {
          firstTagStored = rawStoredTags[rawStoredTagIndex];
        }
        if(rawStoredTagPrefixes[rawStoredTagIndex] === secondMappingTag && !secondTagStored) {
          secondTagStored = rawStoredTags[rawStoredTagIndex];
        }
      }

      if (firstTagBackend && firstTagStored && !secondTagStored) {
        var tagToPush = secondMappingTag + this._extractCode(firstTagStored, firstMappingTag) +'_unknown';

        if(rawStoredTags.indexOf(tagToPush) < 0) {
          rawStoredTags.push(tagToPush);
        }
      }
    }

    return this._mapTagArrayToTagsObject(rawStoredTags);
  },

  _updateTagCache: function(pixelId, tags) {
    if (this.storage.isEnabled()) {
      if(constants.IS_FALLBACK) {
        var rawStoredTags = this.storage.get("glimrTags_" + pixelId);

        if(rawStoredTags && this._isFallbackValid(pixelId)) {
          var newTags = this._prepareTagCacheForFallbackTags(pixelId, this._deserializeTags(rawStoredTags), tags);

          this.storage.set("glimrTags_" + pixelId, this._serializeTags(newTags));
          this.storage.set("glimrTags_" + pixelId + "_lastUpdate", new Date().getTime());
        } else {
          this.storage.set("glimrTags_" + pixelId + "_fallbackInit", new Date().getTime());
          this.storage.set("glimrTags_" + pixelId + "_lastUpdate", new Date().getTime());
          this.storage.set("glimrTags_" + pixelId, this._serializeTags(tags));
        }
      }

      if(!constants.IS_FALLBACK) {
        this.storage.set("glimrTags_" + pixelId + "_lastUpdate", new Date().getTime());
        this.storage.set("glimrTags_" + pixelId, this._serializeTags(tags));
      }
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
