"use strict";

function GlimrEnrichment() {
  this.data = {};
}

GlimrEnrichment.prototype = {
  storePosition: function(positionObject) {
    if (typeof positionObject.latitude !== "number" || typeof positionObject.longitude !== "number") {
      throw new Error("Glimr.storePosition requires one argument, an object with a numeric .latitude and .longitude");
    }

    this._store("u_pos", [positionObject.latitude, positionObject.longitude].join(","));
  },

  _store: function(key, value) {
    this.data[key] = value;
  },

  _flush: function() {
    var oldData = this.data;
    this.data = {};
    return oldData;
  }
};

module.exports = GlimrEnrichment;
