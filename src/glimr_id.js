"use strict";

var Cookies = require("./lib/cookies");
var UUID = require("./lib/uuid");

function GlimrId() {
  this.initialize();
}

GlimrId.prototype = {
  initialize: function() {
    this._id = Cookies.readCookie("__glmrid");
    if (!this._id) {
      this.setId(UUID.generate());
    }
  },

  setGlimrCookie: function() {
    Cookies.createCookie("__glmrid", this._id);
  },

  getId: function() {
    return this._id;
  },

  setId: function(id) {
    this._id = id;
    this.setGlimrCookie();
  }
};

module.exports = GlimrId;
