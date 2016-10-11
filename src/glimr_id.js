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
      this._id = UUID.generate();
      this.setGlimrCookie();
    }
  },

  setGlimrCookie: function() {
    Cookies.createCookie("__glmrid", this._id);
  },

  getId: function() {
    return this._id;
  }
};

module.exports = GlimrId;
