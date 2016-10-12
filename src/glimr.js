"use strict";

var functools = require("./lib/functools");

var constants = require("./constants");

var GlimrSerialize = require("./serialize");
var GlimrTags = require("./tags");
var GlimrId = require("./glimr_id");
var GlimrTagCache = require("./tag_cache");
var GlimrStorage = require("./storage");
var GlimrEnrichment = require("./enrichment");

var GlimrClass = function() {
  this.constructor = GlimrClass;
  this.initialize();
};

GlimrClass.prototype = {
  initialize: function() {
    this.url = {
      host: constants.GLIMR_HOST,
      tags: constants.GLIMR_PATHS.tags,
      store: constants.GLIMR_PATHS.store
    };

    this.glimrId = new GlimrId();
    this.storage = new GlimrStorage(functools.bindFunction(this, function() {
      return this.useLocalStorage;
    }));
    this.enrichment = new GlimrEnrichment();
    this.tagCache = new GlimrTagCache(this.storage);
    this.tags = new GlimrTags(this.storage, this.tagCache, this.glimrId, this.url, this.enrichment);

    this.useLocalStorage = GlimrStorage.isSupportedByBrowser();
  }
};

var serializePublicMethods = [
  "objectToQuery",
  "arrayToQuery",
  "queryToObject",
  "escapeStringForQuery",
  "unescapeStringForQuery"
];

var i;
for (i = 0; i < serializePublicMethods.length; i++) (function(method) {
  GlimrClass.prototype[method] = GlimrSerialize[method];
})(serializePublicMethods[i]);

var tagPublicMethods = [
  "getPixelLastUpdated",
  "getCachedURLTags",
  "getCachedBehaviorTags",
  "getCachedBehaviorTagsAndUpdateInBackground",
  "getTagsAndPushToDataLayer",
  "getTags"
];

for (i = 0; i < tagPublicMethods.length; i++) (function(method) {
  GlimrClass.prototype[method] = function() {
    return this.tags[method].apply(this.tags, arguments);
  }
})(tagPublicMethods[i]);

var tagCachePublicMethods = [
  "usesTagCache",
  "isTagCacheValid",
  "setTagCacheTimeInSeconds",
  "getTagCacheTimeInSeconds",
  "currentURLIdentifier"
];

for (i = 0; i < tagCachePublicMethods.length; i++) (function(method) {
  GlimrClass.prototype[method] = function() {
    return this.tagCache[method].apply(this.tagCache, arguments);
  }
})(tagCachePublicMethods[i]);

var enrichmentPublicMethods = [
  "storePosition"
];

for (i = 0; i < enrichmentPublicMethods.length; i++) (function(method) {
  GlimrClass.prototype[method] = function() {
    return this.enrichment[method].apply(this.enrichment, arguments);
  }
})(enrichmentPublicMethods[i]);

module.exports = new GlimrClass();
