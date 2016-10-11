var Storage = require("lib/storage");
var Cookies = require("lib/cookies");
var UUID = require("lib/uuid");

var GlimrSerialize = require("./serialize");
var GlimrTags = require("./tags");
var GlimrTagCache = require("./tag_cache");
var GlimrStorage = require("./storage");

var GlimrClass = function() {
  this.constructor = GlimrClass;
  this.initialize();
};

var Gp = GlimrClass.prototype;

Gp.initialize = function() {
  this.networkRequests = 0;

  this.url = {
    host: GLIMR_HOST,
    tags: GLIMR_PATHS.tags,
    store: GLIMR_PATHS.store
  };

  this.useLocalStorage = !!Storage;
  this.state = {
    urlCache: {},
    loadingTags: {},
    loadedTags: {}
  };
};

Gp.initGlimrId = function() {
  this.glimrId = Cookies.readCookie("__glmrid");
  if (!this.glimrId) {
    this.glimrId = UUID.generate();
    this.setGlimrCookie();
  }
};

Gp.setGlimrCookie = function() {
  Cookies.createCookie("__glmrid", this.glimrId);
};

module.exports = GlimrClass();
