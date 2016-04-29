(function(window) {
  "use strict";

  var GLIMR_HOST = "//pixel.glimr.io";
  var GLIMR_TAGS_PATH = "/v3/iptags/:id/";

  var MAX_CACHE_TIME = 300;

  var MD5 = function() {};

  var CACHE_TIMINGS = {
    tags: 0
  };

  var Library = {
    // From: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind
    bindFunction: function(oThis, func) {
      var aArgs = Array.prototype.slice.call(arguments, 2);
      var fToBind = func;
      var NOP = function() {};
      var fBound = function() {
        return fToBind.apply(this instanceof NOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (func.prototype) {
        // Function.prototype doesn't have a prototype property
        NOP.prototype = func.prototype;
      }

      fBound.prototype = new NOP();

      return fBound;
    },

    JSONP: function(url, callback) {
      window.Glimr.networkRequests += 1;

      var timestamp = new Date().getTime();
      var generatedFunction = "glmrjsonp" + Math.round(timestamp + Math.random() * 1000001);

      var jsonpScript = document.createElement("script");

      window[generatedFunction] = function(json) {
        callback(json);

        try {
          delete window[generatedFunction];
        } catch (e) {
          window[generatedFunction] = undefined;
        }

        try {
          jsonpScript.parentNode.removeChild(jsonpScript);
        } catch (e) {}
      };

      url += (url.indexOf("?") === -1) ? "?" : "&";
      url += "callback=" + generatedFunction;

      if (typeof jsonpScript.addEventListener === "function") {
        jsonpScript.addEventListener("error", function() {
          callback(false);
        }, false);
      }
      jsonpScript.setAttribute("src", url);
      document.getElementsByTagName("head")[0].appendChild(jsonpScript);
    },

    createCookie: function(name, value, days) {
      var domainPieces = document.location.hostname.split(".");
      var domain = domainPieces.slice(domainPieces.length - 2, domainPieces.length).join(".");

      var expires = "";

      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
      }

      document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;
    },

    readCookie: function(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i += 1) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }

        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
      }
      return null;
    },

    generateUUID: function() {
      var d = new Date().getTime();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
  };

  var GlimrClass = function() {
    this.constructor = GlimrClass;
    this.initialize();
  };

  var Gp = GlimrClass.prototype;

  Gp.initialize = function() {
    this.networkRequests = 0;

    this.url = {
      host: GLIMR_HOST,
      tags: GLIMR_TAGS_PATH
    };

    this.useLocalStorage = !!window.localStorage;
    this.state = {
      urlCache: {},
      loadingTags: {},
      loadedTags: {}
    };
  };

  Gp.initGlimrId = function() {
    this.glimrId = Library.readCookie("__glmrid");
    if (!this.glimrId) {
      this.glimrId = Library.generateUUID();
      this.setGlimrCookie();
    }
  };

  Gp.setTagCacheTimeInSeconds = function(seconds) {
    if (seconds > MAX_CACHE_TIME) {
      seconds = MAX_CACHE_TIME;
    }

    CACHE_TIMINGS.tags = seconds;
  };

  Gp.getTagCacheTimeInSeconds = function() {
    return CACHE_TIMINGS.tags;
  };

  Gp.setGlimrCookie = function() {
    Library.createCookie("__glmrid", this.glimrId);
  };

  Gp.currentURLCacheKey = function() {
    if (this.state.currentURLCacheKey) {
      return this.state.currentURLCacheKey;
    } else {
      return MD5(document.location.pathname).substr(0, 10);
    }
  };

  Gp.getPixelLastUpdated = function(pixelId) {
    if (this.useLocalStorage) {
      return localStorage["glimrArticleTags_" + pixelId + "_lastUpdate"] || false;
    } else {
      return false;
    }
  };

  Gp.getCachedURLTags = function(pixelId) {
    var cachedTags = this._getOrUnmarshalCache(pixelId);
    var cacheKey = this.currentURLCacheKey();

    if (!cachedTags[cacheKey]) {
      cachedTags[cacheKey] = [];
    }

    return cachedTags[cacheKey];
  };

  Gp.getCachedTags = function(pixelId) {
    if (window.console && window.console.warn) {
      window.console.warn("`Glimr.getCachedTags` has been deprecated in favor of `Glimr.getCachedURLTags` for getting pre-fetched tags synchronously. `Glimr.getCachedTags` and `Glimr.getCachedURLTags` only return a subset of the available tags, use `Glimr.getTags` for fetching all tags, which takes care of caching behind the scenes.");
    }
    return this.getCachedURLTags.apply(this, arguments);
  };

  Gp.getTags = function(pixelId, callback) {
    if (this.state.loadedTags[pixelId]) {
      callback(this.state.loadedTags[pixelId]);
      return;
    }

    if (typeof this.state.loadingTags[pixelId] !== "undefined") {
      this.state.loadingTags[pixelId].push(callback);
      return;
    }

    this.state.loadingTags[pixelId] = [];
    this.state.loadingTags[pixelId].push(callback);

    this._requestTags(pixelId, callback, Library.bindFunction(this, function(data) {
      var tags = [];
      if (data && data.tags) {
        tags = data.tags;
      }

      if (data && data.cache) {
        this._updateURLCache(pixelId, data.cache);
      }

      if (this.usesTagCache()) {
        this._updateTagCache(pixelId, tags);
      }

      var cachedTags = this.getCachedURLTags(pixelId);
      for (var i = 0; i < cachedTags.length; i += 1) {
        if (tags.indexOf(cachedTags[i]) === -1) {
          tags.push(cachedTags[i]);
        }
      }

      this.state.loadedTags[pixelId] = tags;

      var callbacks = this.state.loadingTags[pixelId];
      delete this.state.loadingTags[pixelId];

      for (var j = 0; j < callbacks.length; j += 1) {
        callbacks[j](tags);
      }

      if (typeof data.id === "string" && data.id !== this.glimrId) {
        this.glimrId = data.id;
        this.setGlimrCookie();
      }
    }));
  };

  Gp._getLocalTags = function(pixelId, callback) {
    var storedTags = localStorage["glimrTags_" + pixelId].split(",");
    var urlTags = this.getCachedURLTags(pixelId);

    callback(storedTags.concat(urlTags));
  };

  Gp._requestTags = function(pixelId, userCallback, parseCallback) {
    this.initGlimrId();

    var pixelLastUpdated = this.getPixelLastUpdated(pixelId);

    var extraParams = "";
    if (pixelLastUpdated) {
      extraParams += "&keywords_last_updated=" + pixelLastUpdated;
    }

    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId + extraParams;

    // If cache is enabled we check the validity of the tag cache
    if (this.usesTagCache()) {
      var lastUpdated = parseInt(localStorage["glimrTags_" + pixelId + "_lastUpdate"], 10);
      var now = new Date().getTime();

      if (!isNaN(lastUpdated) && (now - lastUpdated) / 1000 < CACHE_TIMINGS.tags) {
        this._getLocalTags(pixelId, userCallback);
        return;
      }
    }

    Library.JSONP(requestUrl, parseCallback);
  };

  Gp.getTagsAndPushToDataLayer = function(pixelId, callback) {
    this.getTags(pixelId, function(tags) {
      if (window.dataLayer && window.dataLayer.push) {
        window.dataLayer.push({
          "glimrTags": tags,
          "event": "glimr.tags"
        });
      }

      if (callback && typeof callback === "function") {
        callback();
      }
    });
  };

  Gp.usesTagCache = function() {
    return CACHE_TIMINGS.tags > 0 && this.useLocalStorage;
  };

  Gp._unmarshalTags = function(tags) {
    if (!tags) {
      return {};
    }

    var allTags = tags.split("|");
    var cacheMap = {};
    for (var i = 0; i < allTags.length; i += 1 ) {
      var equalsPosition = allTags[i].indexOf("=");
      var name = allTags[i].substring(0, equalsPosition);
      cacheMap[name] = allTags[i].substring(equalsPosition + 1).split(",");
    }
    return cacheMap;
  };

  Gp._marshalTags = function(cache) {
    var cachePieces = [];
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        cachePieces.push(key.substr(0, 10) + "=" + cache[key].join(","));
      }
    }
    return cachePieces.join("|");
  };

  Gp._updateURLCache = function(pixelId, cache) {
    if (this.useLocalStorage) {
      localStorage["glimrArticleTags_" + pixelId] = this._marshalTags(cache);
      localStorage["glimrArticleTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
    }
    if (!this.state.urlCache[pixelId]) {
      this.state.urlCache[pixelId] = {};
    }
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        this.state.urlCache[pixelId][key.substr(0, 10)] = cache[key];
      }
    }
  };

  Gp._getOrUnmarshalCache = function(pixelId) {
    if (this.useLocalStorage && localStorage["glimrArticleTags_" + pixelId]) {
      this.state.urlCache[pixelId] = this._unmarshalTags(localStorage["glimrArticleTags_" + pixelId]);
    }
    return this.state.urlCache[pixelId] || {};
  };

  Gp._updateTagCache = function(pixelId, tags) {
    if (this.useLocalStorage) {
      localStorage["glimrTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
      localStorage["glimrTags_" + pixelId] = tags.join(",");
    }
  };

  MD5 = function(string) {
    function rotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function addUnsigned(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    }

    function f1(x, y, z) {
      return (x & y) | ((~x) & z);
    }

    function g1(x, y, z) {
      return (x & z) | (y & (~z));
    }

    function h1(x, y, z) {
      return (x ^ y ^ z);
    }

    function i1(x, y, z) {
      return (y ^ (x | (~z)));
    }

    function fF(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(f1(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function gG(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(g1(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function hH(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(h1(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function iI(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(i1(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }

    function convertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
        lByteCount += 1;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    }

    function wordToHex(lValue) {
      var wordToHexValue = "",
        wordToHexValue_temp = "",
        lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount += 1) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = "0" + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    }

    function utf8Encode(string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";

      for (var n = 0; n < string.length; n += 1) {
        var c = string.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }

      }

      return utftext;
    }

    var x = [];
    var k, AA, BB, CC, DD, a, b, c, d;
    var s11 = 7,
      s12 = 12,
      s13 = 17,
      s14 = 22;
    var s21 = 5,
      s22 = 9,
      s23 = 14,
      s24 = 20;
    var s31 = 4,
      s32 = 11,
      s33 = 16,
      s34 = 23;
    var s41 = 6,
      s42 = 10,
      s43 = 15,
      s44 = 21;

    string = utf8Encode(string);

    x = convertToWordArray(string);

    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;

    for (k = 0; k < x.length; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = fF(a, b, c, d, x[k + 0], s11, 0xD76AA478);
      d = fF(d, a, b, c, x[k + 1], s12, 0xE8C7B756);
      c = fF(c, d, a, b, x[k + 2], s13, 0x242070DB);
      b = fF(b, c, d, a, x[k + 3], s14, 0xC1BDCEEE);
      a = fF(a, b, c, d, x[k + 4], s11, 0xF57C0FAF);
      d = fF(d, a, b, c, x[k + 5], s12, 0x4787C62A);
      c = fF(c, d, a, b, x[k + 6], s13, 0xA8304613);
      b = fF(b, c, d, a, x[k + 7], s14, 0xFD469501);
      a = fF(a, b, c, d, x[k + 8], s11, 0x698098D8);
      d = fF(d, a, b, c, x[k + 9], s12, 0x8B44F7AF);
      c = fF(c, d, a, b, x[k + 10], s13, 0xFFFF5BB1);
      b = fF(b, c, d, a, x[k + 11], s14, 0x895CD7BE);
      a = fF(a, b, c, d, x[k + 12], s11, 0x6B901122);
      d = fF(d, a, b, c, x[k + 13], s12, 0xFD987193);
      c = fF(c, d, a, b, x[k + 14], s13, 0xA679438E);
      b = fF(b, c, d, a, x[k + 15], s14, 0x49B40821);
      a = gG(a, b, c, d, x[k + 1], s21, 0xF61E2562);
      d = gG(d, a, b, c, x[k + 6], s22, 0xC040B340);
      c = gG(c, d, a, b, x[k + 11], s23, 0x265E5A51);
      b = gG(b, c, d, a, x[k + 0], s24, 0xE9B6C7AA);
      a = gG(a, b, c, d, x[k + 5], s21, 0xD62F105D);
      d = gG(d, a, b, c, x[k + 10], s22, 0x2441453);
      c = gG(c, d, a, b, x[k + 15], s23, 0xD8A1E681);
      b = gG(b, c, d, a, x[k + 4], s24, 0xE7D3FBC8);
      a = gG(a, b, c, d, x[k + 9], s21, 0x21E1CDE6);
      d = gG(d, a, b, c, x[k + 14], s22, 0xC33707D6);
      c = gG(c, d, a, b, x[k + 3], s23, 0xF4D50D87);
      b = gG(b, c, d, a, x[k + 8], s24, 0x455A14ED);
      a = gG(a, b, c, d, x[k + 13], s21, 0xA9E3E905);
      d = gG(d, a, b, c, x[k + 2], s22, 0xFCEFA3F8);
      c = gG(c, d, a, b, x[k + 7], s23, 0x676F02D9);
      b = gG(b, c, d, a, x[k + 12], s24, 0x8D2A4C8A);
      a = hH(a, b, c, d, x[k + 5], s31, 0xFFFA3942);
      d = hH(d, a, b, c, x[k + 8], s32, 0x8771F681);
      c = hH(c, d, a, b, x[k + 11], s33, 0x6D9D6122);
      b = hH(b, c, d, a, x[k + 14], s34, 0xFDE5380C);
      a = hH(a, b, c, d, x[k + 1], s31, 0xA4BEEA44);
      d = hH(d, a, b, c, x[k + 4], s32, 0x4BDECFA9);
      c = hH(c, d, a, b, x[k + 7], s33, 0xF6BB4B60);
      b = hH(b, c, d, a, x[k + 10], s34, 0xBEBFBC70);
      a = hH(a, b, c, d, x[k + 13], s31, 0x289B7EC6);
      d = hH(d, a, b, c, x[k + 0], s32, 0xEAA127FA);
      c = hH(c, d, a, b, x[k + 3], s33, 0xD4EF3085);
      b = hH(b, c, d, a, x[k + 6], s34, 0x4881D05);
      a = hH(a, b, c, d, x[k + 9], s31, 0xD9D4D039);
      d = hH(d, a, b, c, x[k + 12], s32, 0xE6DB99E5);
      c = hH(c, d, a, b, x[k + 15], s33, 0x1FA27CF8);
      b = hH(b, c, d, a, x[k + 2], s34, 0xC4AC5665);
      a = iI(a, b, c, d, x[k + 0], s41, 0xF4292244);
      d = iI(d, a, b, c, x[k + 7], s42, 0x432AFF97);
      c = iI(c, d, a, b, x[k + 14], s43, 0xAB9423A7);
      b = iI(b, c, d, a, x[k + 5], s44, 0xFC93A039);
      a = iI(a, b, c, d, x[k + 12], s41, 0x655B59C3);
      d = iI(d, a, b, c, x[k + 3], s42, 0x8F0CCC92);
      c = iI(c, d, a, b, x[k + 10], s43, 0xFFEFF47D);
      b = iI(b, c, d, a, x[k + 1], s44, 0x85845DD1);
      a = iI(a, b, c, d, x[k + 8], s41, 0x6FA87E4F);
      d = iI(d, a, b, c, x[k + 15], s42, 0xFE2CE6E0);
      c = iI(c, d, a, b, x[k + 6], s43, 0xA3014314);
      b = iI(b, c, d, a, x[k + 13], s44, 0x4E0811A1);
      a = iI(a, b, c, d, x[k + 4], s41, 0xF7537E82);
      d = iI(d, a, b, c, x[k + 11], s42, 0xBD3AF235);
      c = iI(c, d, a, b, x[k + 2], s43, 0x2AD7D2BB);
      b = iI(b, c, d, a, x[k + 9], s44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

    return temp.toLowerCase();
  };

  window.Glimr = new GlimrClass();
})(window);
