(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = {
  GLIMR_HOST: "//pixel.glimr.io",
  GLIMR_PATHS: {
    tags: "/v4/iptags/:id/",
    store: "/v4/collect/:id/"
  },

  MAX_CACHE_TIME: 300,

  CACHE_TIMINGS: {
    tags: 0
  },

  V2_PREFIX: "[v2]:"
};

},{}],2:[function(require,module,exports){
"use strict";

var Storage = require("./lib/storage");
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

    this.useLocalStorage = !!Storage;

    this.glimrId = new GlimrId();
    this.tagCache = new GlimrTagCache(Storage, this.useLocalStorage);
    this.tags = new GlimrTags(Storage, this.useLocalStorage, this.tagCache, this.glimrId, this.url);
  }
};

module.exports = new GlimrClass();

},{"./constants":1,"./glimr_id":3,"./lib/storage":9,"./serialize":11,"./storage":12,"./tag_cache":13,"./tags":14}],3:[function(require,module,exports){
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

},{"./lib/cookies":4,"./lib/uuid":10}],4:[function(require,module,exports){
"use strict";

var Cookies = {
  createCookie: function(name, value, days) {
    var domainPieces = window.document.location.hostname.split(".");
    var domain = domainPieces.slice(domainPieces.length - 2, domainPieces.length).join(".");

    var expires = "";

    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
    }

    window.document.cookie = name + "=" + value + expires + "; path=/; domain=" + domain;
  },

  readCookie: function(name) {
    var nameEQ = name + "=";
    var ca = window.document.cookie.split(';');
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
  }
};

module.exports = Cookies;

},{}],5:[function(require,module,exports){
"use strict";

var functools = {
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
  }
};

module.exports = functools;

},{}],6:[function(require,module,exports){
"use strict";

var JSONP = function(url, callback) {
  var timestamp = new Date().getTime();
  var generatedFunction = "glmrjsonp" + Math.round(timestamp + Math.random() * 1000001);

  var jsonpScript = window.document.createElement("script");

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
  window.document.getElementsByTagName("head")[0].appendChild(jsonpScript);
};

module.exports = JSONP;

},{}],7:[function(require,module,exports){
"use strict";

var md5 = function(string) {
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

module.exports = md5;

},{}],8:[function(require,module,exports){
"use strict";

var objecttools = {
  flattenObjectIntoArray: function(obj) {
    var ret = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        var data = obj[key];

        if (typeof data === "object" && data.constructor === Array) {
          for (var i = 0, j = data.length; i < j; i += 1) {
            ret.push(data[i]);
          }
        } else if (typeof data === "object") {
          ret = ret.concat(objecttools.flattenObjectIntoArray(data));
        } else {
          ret.push(data);
        }
      }
    }
    return ret;
  }
};

module.exports = objecttools;

},{}],9:[function(require,module,exports){
"use strict";

// Feature detect + local reference
// https://mathiasbynens.be/notes/localstorage-pattern
var Storage = (function() {
	var uid = new Date().getTime().toString();
	var storage;
	var result;
	try {
		(storage = window.localStorage).setItem(uid, uid);
		result = storage.getItem(uid) === uid;
		storage.removeItem(uid);
		return result && storage;
	} catch (exception) {}
}());

module.exports = Storage;

},{}],10:[function(require,module,exports){
"use strict";

var UUID = {
  generate: function() {
    var d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
};

module.exports = UUID;

},{}],11:[function(require,module,exports){
"use strict";

var GlimrSerialize = {
  objectToQuery: function(dictionary) {
    var ret = [];
    for (var key in dictionary) {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        var value = dictionary[key];

        if (typeof value === "object" && value.constructor === Array) {
          ret.push(GlimrSerialize.arrayToQuery(value, key));
        } else if (typeof key === "object") {
          ret.push(GlimrSerialize.objectToQuery(value));
        } else {
          ret.push(GlimrSerialize.escapeStringForQuery(key) + "=" + GlimrSerialize.escapeStringForQuery(value));
        }

        ret.push("&");
      }
    }

    // Remove last &
    ret.pop();

    return ret.join("");
  },

  arrayToQuery: function(arr, key) {
    key = key || "";
    var escapedKey = GlimrSerialize.escapeStringForQuery(key);

    var ret = [];
    for (var i = 0, j = arr.length; i < j; i += 1) {
      var value = GlimrSerialize.escapeStringForQuery(arr[i]);
      ret.push(escapedKey + "=" + value);
    }
    return ret.join("&");
  },

  queryToObject: function(str) {
    var ret = {};

    var arr = str.split("&");
    for (var i = 0, j = arr.length; i < j; i += 1) {
      var pieces = arr[i].split("=");

      var key = GlimrSerialize.unescapeStringForQuery(pieces[0] || "");
      var value = GlimrSerialize.unescapeStringForQuery(pieces[1] || "");

      if (typeof ret[key] === "undefined") {
        ret[key] = [];
      }

      if (value.length > 0) {
        ret[key].push(value);
      }
    }

    return ret;
  },

  escapeStringForQuery: function(str) {
    return encodeURIComponent(str);
  },

  unescapeStringForQuery: function(str) {
    return decodeURIComponent(str);
  }
};

module.exports = GlimrSerialize;

},{}],12:[function(require,module,exports){
"use strict";

var JSONP = require("./lib/jsonp");

module.exports = {
  storeLocation: function(pixelId, longitude, latitude, callback) {
    var parameters = "longitude=" + encodeURIComponent(longitude) + "&latitude=" + encodeURIComponent(latitude);
    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId + "&" + parameters;

    JSONP(requestUrl, function() {

    });
  }
};

},{"./lib/jsonp":6}],13:[function(require,module,exports){
"use strict";

var md5 = require("./lib/md5");
var constants = require("./constants");
var GlimrSerialize = require("./serialize");

function TagCache(storage, useLocalStorage) {
  this.storage = storage;
  this.useLocalStorage = useLocalStorage;

  this.state = {
    urlCache: {}
  };
}

TagCache.prototype = {
  unmarshalTags: function(tags) {
    if (!tags) {
      return {};
    }

    var allTags = tags.split("|");
    var cacheMap = {};
    for (var i = 0; i < allTags.length; i += 1 ) {
      var equalsPosition = allTags[i].indexOf("=");
      var name = allTags[i].substring(0, equalsPosition);
      cacheMap[name] = this.deserializeTags(allTags[i].substring(equalsPosition + 1));
    }
    return cacheMap;
  },

  marshalTags: function(cache) {
    var cachePieces = [];
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        cachePieces.push(key.substr(0, 10) + "=" + this.serializeTags(cache[key]));
      }
    }
    return cachePieces.join("|");
  },

  updateURLCache: function(pixelId, cache) {
    if (this.useLocalStorage) {
      this.storage["glimrArticleTags_" + pixelId] = this.marshalTags(cache);
      this.storage["glimrArticleTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
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

  getOrUnmarshalCache: function(pixelId) {
    if (this.useLocalStorage && this.storage["glimrArticleTags_" + pixelId]) {
      this.state.urlCache[pixelId] = this.unmarshalTags(this.storage["glimrArticleTags_" + pixelId]);
    }
    return this.state.urlCache[pixelId] || {};
  },

  serializeTags: function(tags) {
    if (typeof tags === "object" && tags.constructor === Array) {
      return tags.join(",");
    } else {
      return constants.V2_PREFIX + GlimrSerialize.objectToQuery(tags);
    }
  },

  deserializeTags: function(tagString) {
    tagString = tagString || "";

    if (tagString.substr(0, constants.V2_PREFIX.length) === constants.V2_PREFIX) {
      return GlimrSerialize.queryToObject(tagString.substr(constants.V2_PREFIX.length));
    } else {
      if (tagString === "") {
        return [];
      } else {
        return tagString.split(",");
      }
    }
  },

  updateTagCache: function(pixelId, tags) {
    if (this.useLocalStorage) {
      this.storage["glimrTags_" + pixelId + "_lastUpdate"] = new Date().getTime();
      this.storage["glimrTags_" + pixelId] = this.serializeTags(tags);
    }
  },

  usesTagCache: function() {
    return constants.CACHE_TIMINGS.tags > 0 && this.useLocalStorage;
  },

  isTagCacheValid: function(pixelId) {
    var lastUpdated = parseInt(this.storage["glimrTags_" + pixelId + "_lastUpdate"], 10);
    var now = new Date().getTime();

    return !isNaN(lastUpdated) && (now - lastUpdated) / 1000 < constants.CACHE_TIMINGS.tags;
  },

  setTagCacheTimeInSeconds: function(seconds) {
    if (seconds > constants.MAX_CACHE_TIME) {
      seconds = constants.MAX_CACHE_TIME;
    }

    constants.CACHE_TIMINGS.tags = seconds;
  },

  getTagCacheTimeInSeconds: function() {
    return constants.CACHE_TIMINGS.tags;
  },

  currentURLCacheKey: function() {
    if (this.state.currentURLCacheKey) {
      return this.state.currentURLCacheKey;
    } else {
      return md5(this.currentURLIdentifier()).substr(0, 10);
    }
  }
};

module.exports = TagCache;

},{"./constants":1,"./lib/md5":7,"./serialize":11}],14:[function(require,module,exports){
"use strict";

var functools = require("./lib/functools");
var objecttools = require("./lib/objecttools");
var md5 = require("./lib/md5");
var JSONP = require("./lib/jsonp");

var constants = require("./constants");

function GlimrTags(storage, useLocalStorage, tagCache, glimrId, url) {
  this.storage = storage;
  this.useLocalStorage = useLocalStorage;
  this.tagCache = tagCache;
  this.state = {
    loadingTags: {},
    loadedTags: {},
    currentURLCacheKey: false
  };
  this.networkRequests = 0;
  this.glimrId = glimrId;
  this.url = url;
}

GlimrTags.prototype = {
  currentURLIdentifier: function() {
    if (window.document.location.hash && window.document.location.hash.indexOf("#!") !== -1) {
      return window.document.location.hash.replace("#!", "");
    } else {
      return window.document.location.pathname;
    }
  },

  getPixelLastUpdated: function(pixelId) {
    if (this.useLocalStorage) {
      return this.storage["glimrArticleTags_" + pixelId + "_lastUpdate"] || false;
    } else {
      return false;
    }
  },

  getCachedURLTags: function(pixelId) {
    var cachedTags = this.tagCache.getOrUnmarshalCache(pixelId);
    var cacheKey = this.currentURLCacheKey();

    if (!cachedTags[cacheKey]) {
      cachedTags[cacheKey] = [];
    }

    return cachedTags[cacheKey];
  },

  getCachedBehaviorTags: function(pixelId) {
    if (this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this.getLocalTags(pixelId);
      return params[0];
    } else {
      return false;
    }
  },

  getCachedBehaviorTagsAndUpdateInBackground: function(pixelId, options) {
    options = options || {};
    options.onUpdate = typeof options.onUpdate === "function" ? options.onUpdate : function() {};

    if (!this.tagCache.usesTagCache()) {
      if (window.console) {
        window.console.error("Caching not enabled. Enable with Glimr.setTagCacheTimeInSeconds(number)");
      }
      return [];
    }

    var cachedTags = this.getLocalTags(pixelId);

    if (!this.tagCache.isTagCacheValid(pixelId)) {
      this.getTags(pixelId, options.onUpdate);
    }

    return cachedTags[0] || false;
  },

  getTagsAndPushToDataLayer: function(pixelId, callback) {
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
  },

  getTags: function(pixelId, callback) {
    var pageCacheId = pixelId + this.currentURLCacheKey();
    if (this.state.loadedTags[pageCacheId]) {
      var response = this.state.loadedTags[pageCacheId];
      callback(response[0], response[1]);
      return;
    }

    if (typeof this.state.loadingTags[pageCacheId] !== "undefined") {
      this.state.loadingTags[pageCacheId].push(callback);
      return;
    }

    this.requestTags(pixelId, pageCacheId, callback, functools.bindFunction(this, function(data) {
      var tags = [];
      var tagMappings = {};
      var toCache = tags;
      if (data && data.tags) {
        tags = data.tags;
        toCache = tags;
      }

      if (data && data.mapping) {
        tagMappings = data.mapping;
        toCache = tagMappings;
      }

      if (data && data.cache) {
        this.tagCache.updateURLCache(pixelId, data.cache);
      }

      if (this.tagCache.usesTagCache()) {
        this.tagCache.updateTagCache(pixelId, toCache);
      }

      var cachedTags = this.tagCache.getCachedURLTags(pixelId);
      for (var i = 0; i < cachedTags.length; i += 1) {
        if (tags.indexOf(cachedTags[i]) === -1) {
          tags.push(cachedTags[i]);
          tagMappings.urlTags = tagMappings.urlTags || [];
          tagMappings.urlTags.push(cachedTags[i]);
        }
      }

      this.state.loadedTags[pageCacheId] = [tags, tagMappings];

      var callbacks = this.state.loadingTags[pageCacheId];
      delete this.state.loadingTags[pageCacheId];

      for (var j = 0; j < callbacks.length; j += 1) {
        callbacks[j](tags, tagMappings);
      }

      if (typeof data.id === "string" && data.id !== this.glimrId) {
        this.glimrId = data.id;
        this.setGlimrCookie();
      }
    }));
  },

  getLocalTags: function(pixelId) {
    var storedTags = this.deserializeTags(this.storage["glimrTags_" + pixelId]);
    var urlTags = this.getCachedURLTags(pixelId);

    // v1
    if (typeof storedTags === "object" && storedTags.constructor === Array) {
      return [storedTags.concat(urlTags), {urlTags: urlTags}];
    } else {
      storedTags.urlTags = urlTags;

      var tagsArray = objecttools.flattenObjectIntoArray(storedTags);
      return [tagsArray, storedTags];
    }
  },

  requestTags: function(pixelId, pageCacheId, userCallback, parseCallback) {
    var pixelLastUpdated = this.getPixelLastUpdated(pixelId);

    var extraParams = "";
    if (pixelLastUpdated) {
      extraParams += "&keywords_last_updated=" + pixelLastUpdated;
    }

    if (window.document.location.hash) {
      extraParams += "&fragment=" + encodeURIComponent(window.document.location.hash);
    }

    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=" + this.glimrId + extraParams;

    if (this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this.getLocalTags(pixelId);
      userCallback(params[0], params[1]);
      return;
    }

    this.state.loadingTags[pageCacheId] = [];
    this.state.loadingTags[pageCacheId].push(userCallback);

    this.networkRequests += 1;

    JSONP(requestUrl, parseCallback);
  }
};

module.exports = GlimrTags;

},{"./constants":1,"./lib/functools":5,"./lib/jsonp":6,"./lib/md5":7,"./lib/objecttools":8}]},{},[2]);
