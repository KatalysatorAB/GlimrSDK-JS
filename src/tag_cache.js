module.exports = {
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

  _updateURLCache: function(pixelId, cache) {
    if (this.useLocalStorage) {
      storage["glimrArticleTags_" + pixelId] = this._marshalTags(cache);
      storage["glimrArticleTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
    }
    if (!this.state.urlCache[pixelId]) {
      this.state.urlCache[pixelId] = {};
    }
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        this.state.urlCache[pixelId][key.substr(0, 10)] = cache[key];
      }
    }
  },

  _getOrUnmarshalCache: function(pixelId) {
    if (this.useLocalStorage && storage["glimrArticleTags_" + pixelId]) {
      this.state.urlCache[pixelId] = this._unmarshalTags(storage["glimrArticleTags_" + pixelId]);
    }
    return this.state.urlCache[pixelId] || {};
  },

  _serializeTags: function(tags) {
    if (typeof tags === "object" && tags.constructor === Array) {
      return tags.join(",");
    } else {
      return V2_PREFIX + this.objectToQuery(tags);
    }
  },

  _deserializeTags: function(tagString) {
    tagString = tagString || "";

    if (tagString.substr(0, V2_PREFIX.length) === V2_PREFIX) {
      return this.queryToObject(tagString.substr(V2_PREFIX.length));
    } else {
      if (tagString === "") {
        return [];
      } else {
        return tagString.split(",");
      }
    }
  },

  _updateTagCache: function(pixelId, tags) {
    if (this.useLocalStorage) {
      storage["glimrTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
      storage["glimrTags_" + pixelId] = this._serializeTags(tags);
    }
  }
}
