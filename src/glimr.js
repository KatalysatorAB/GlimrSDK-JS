"use strict";

var functools = require("./lib/functools");

var constants = require("./constants");

var GlimrSerialize = require("./serialize");
var GlimrTags = require("./tags");
var GlimrId = require("./glimr_id");
var GlimrTagCache = require("./tag_cache");
var GlimrStorage = require("./storage");

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
    this.tagCache = new GlimrTagCache(this.storage);
    this.tags = new GlimrTags(this.storage, this.tagCache, this.glimrId, this.url);

    this.useLocalStorage = GlimrStorage.isSupportedByBrowser();
  },

  // serialize.js
  objectToQuery: GlimrSerialize.objectToQuery,
  arrayToQuery: GlimrSerialize.arrayToQuery,
  queryToObject: GlimrSerialize.queryToObject,
  escapeStringForQuery: GlimrSerialize.scapeStringForQuery,
  unescapeStringForQuery: GlimrSerialize.unescapeStringForQuery,

  // tags.js
  getTags: function() {
    return this.tags.getTags.apply(this.tags, arguments);
  },

  getCachedBehaviorTags: function() {
    return this.tags.getCachedBehaviorTags.apply(this.tags, arguments);
  },

  getCachedBehaviorTagsAndUpdateInBackground: function() {
    return this.tags.getCachedBehaviorTagsAndUpdateInBackground.apply(this.tags, arguments);
  },

  getTagsAndPushToDataLayer: function() {
    return this.tags.getTagsAndPushToDataLayer.apply(this.tags, arguments);
  },

  // tag_cache.js
  getTagCacheTimeInSeconds: function() {
    return this.tagCache.getTagCacheTimeInSeconds.apply(this.tags, arguments);
  },
  setTagCacheTimeInSeconds: function() {
    return this.tagCache.setTagCacheTimeInSeconds.apply(this.tags, arguments);
  }
};

module.exports = new GlimrClass();
