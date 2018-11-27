"use strict";

function GlimrEnrichment() {
  this.data = {};
  this.hasData = false;
}

GlimrEnrichment.prototype = {
  storePosition: function(positionObject) {
    if (
      (typeof positionObject.longitude === "number" || !isNaN(parseFloat(positionObject.longitude))) &&
      (typeof positionObject.latitude === "number" || !isNaN(parseFloat(positionObject.latitude)))
    ) {
      this._store("u_pos", [positionObject.latitude, positionObject.longitude].join(","));
    } else {
      throw new Error("Glimr.storePosition requires one argument, an object with a numeric .longitude and .latitude");
    }
  },

  storeUid: function(uid) {
    if (uid && typeof uid === 'string') {
      this._store("uid", uid);
    } else {
      throw new Error("Glimr.storeUid requires one string argument");
    }
  },

  _store: function(key, value) {
    this.hasData = true;
    this.data[key] = value;
  },

  _flush: function() {
    var oldData = this.data;
    this.data = {};
    this.hasData = false;
    return oldData;
  },

  _needsToFlush: function() {
    return this.hasData;
  }
};

module.exports = GlimrEnrichment;
