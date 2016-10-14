"use strict";

function GlimrEnrichment() {
  this.data = {};
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
