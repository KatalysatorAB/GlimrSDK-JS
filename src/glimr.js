"use strict";

var functools = require("./lib/functools");

var constants = require("./constants");

var GlimrSerialize = require("./serialize");
var GlimrTags = require("./tags");
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

    this.storage = new GlimrStorage(functools.bindFunction(this, function() {
      return this.useLocalStorage;
    }));
    this.enrichment = new GlimrEnrichment();
    this.tagCache = new GlimrTagCache(this.storage);
    this.tags = new GlimrTags(this.storage, this.tagCache, this.url, this.enrichment);

    this.useLocalStorage = GlimrStorage.isSupportedByBrowser();
  }
};

function aliasMethod(method, on) {
  GlimrClass.prototype[method] = function() {
    return this[on][method].apply(this[on], arguments);
  };
}

var serializePublicMethods = [
  "objectToQuery",
  "arrayToQuery",
  "queryToObject",
  "escapeStringForQuery",
  "unescapeStringForQuery"
];

var i;
for (i = 0; i < serializePublicMethods.length; i += 1) {
  var method = serializePublicMethods[i];
  GlimrClass.prototype[method] = GlimrSerialize[method];
}

var tagPublicMethods = [
  "getPixelLastUpdated",
  "getCachedURLTags",
  "getCachedBehaviorTags",
  "getCachedBehaviorTagsAndUpdateInBackground",
  "getTagsAndPushToDataLayer",
  "getTags"
];

for (i = 0; i < tagPublicMethods.length; i += 1) {
  aliasMethod(tagPublicMethods[i], "tags");
}

var tagCachePublicMethods = [
  "usesTagCache",
  "isTagCacheValid",
  "setTagCacheTimeInSeconds",
  "getTagCacheTimeInSeconds",
  "currentURLIdentifier"
];

for (i = 0; i < tagCachePublicMethods.length; i += 1) {
  aliasMethod(tagCachePublicMethods[i], "tagCache");
}

var enrichmentPublicMethods = [
  "storePosition",
  "storeUid"
];

for (i = 0; i < enrichmentPublicMethods.length; i += 1) {
  aliasMethod(enrichmentPublicMethods[i], "enrichment");
}

module.exports = new GlimrClass();
