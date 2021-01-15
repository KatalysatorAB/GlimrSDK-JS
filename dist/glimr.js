(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Glimr = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
"use strict";

var functools = require("./lib/functools");

var constants = require("./constants");

var GlimrSerialize = require("./serialize");
var GlimrTags = require("./tags");
var GlimrTagCache = require("./tag_cache");
var GlimrStorage = require("./storage");
var GlimrEnrichment = require("./enrichment");

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

    this.storage = new GlimrStorage(functools.bindFunction(this, function() {
      return this.useLocalStorage;
    }));
    this.enrichment = new GlimrEnrichment();
    this.tagCache = new GlimrTagCache(this.storage);
    this.tags = new GlimrTags(this.storage, this.tagCache, this.url, this.enrichment);

    this.useLocalStorage = GlimrStorage.isSupportedByBrowser();
  }
};

function aliasMethod(method, on) {
  GlimrClass.prototype[method] = function() {
    return this[on][method].apply(this[on], arguments);
  };
}

var serializePublicMethods = [
  "objectToQuery",
  "arrayToQuery",
  "queryToObject",
  "escapeStringForQuery",
  "unescapeStringForQuery"
];

var i;
for (i = 0; i < serializePublicMethods.length; i += 1) {
  var method = serializePublicMethods[i];
  GlimrClass.prototype[method] = GlimrSerialize[method];
}

var tagPublicMethods = [
  "getPixelLastUpdated",
  "getCachedURLTags",
  "getCachedBehaviorTags",
  "getCachedBehaviorTagsAndUpdateInBackground",
  "getTagsAndPushToDataLayer",
  "getTags"
];

for (i = 0; i < tagPublicMethods.length; i += 1) {
  aliasMethod(tagPublicMethods[i], "tags");
}

var tagCachePublicMethods = [
  "usesTagCache",
  "isTagCacheValid",
  "setTagCacheTimeInSeconds",
  "getTagCacheTimeInSeconds",
  "currentURLIdentifier"
];

for (i = 0; i < tagCachePublicMethods.length; i += 1) {
  aliasMethod(tagCachePublicMethods[i], "tagCache");
}

var enrichmentPublicMethods = [
  "storePosition",
  "storeUid"
];

for (i = 0; i < enrichmentPublicMethods.length; i += 1) {
  aliasMethod(enrichmentPublicMethods[i], "enrichment");
}

module.exports = new GlimrClass();

},{"./constants":1,"./enrichment":2,"./lib/functools":4,"./serialize":9,"./storage":10,"./tag_cache":11,"./tags":12}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
"use strict";

// Feature detect + local reference
// https://mathiasbynens.be/notes/localstorage-pattern
var storage = (function() {
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

module.exports = storage;

},{}],9:[function(require,module,exports){
"use strict";

var GlimrSerialize = {
  objectToQuery: function(dictionary, prefix) {
    prefix = prefix || "";

    var ret = [];
    for (var key in dictionary) {
      if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
        var value = dictionary[key];

        var keyPrefix;
        if (prefix.length) {
          keyPrefix = prefix + "[" + GlimrSerialize.escapeStringForQuery(key) + "]";
        } else {
          keyPrefix = GlimrSerialize.escapeStringForQuery(key);
        }

        if (typeof value === "object" && value.constructor === Array) {
          for (var i = 0, j = value.length; i < j; i += 1) {
            ret.push(keyPrefix + "=" + GlimrSerialize.escapeStringForQuery(value[i]));
            ret.push("&");
          }

          // Remove last &
          ret.pop();
        } else if (typeof value === "object") {
          ret.push(GlimrSerialize.objectToQuery(value, keyPrefix));
        } else {
          ret.push(keyPrefix + "=" + GlimrSerialize.escapeStringForQuery(value));
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

},{}],10:[function(require,module,exports){
"use strict";

var storage = require("./lib/storage");

function GlimrStorage(isEnabledCallback) {
  this._isEnabledCallback = isEnabledCallback;
}

GlimrStorage.prototype = {
  set: function(key, value) {
    storage[key] = value;
  },

  get: function(key) {
    return storage[key];
  },

  isEnabled: function() {
    return this._isEnabledCallback();
  }
};

GlimrStorage.isSupportedByBrowser = function() {
  return !!storage;
};

module.exports = GlimrStorage;

},{"./lib/storage":8}],11:[function(require,module,exports){
"use strict";

var md5 = require("./lib/md5");
var constants = require("./constants");
var GlimrSerialize = require("./serialize");

function missingParam(n, p) {
  return new TypeError("Parameter #" + n + " is required: " + p);
}

function TagCache(storage) {
  this.storage = storage;

  this.state = {
    urlCache: {},
    currentURLCacheKey: false
  };
}

TagCache.prototype = {
  usesTagCache: function() {
    return constants.CACHE_TIMINGS.tags > 0 && this.storage.isEnabled();
  },

  isTagCacheValid: function(pixelId) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    var lastUpdated = parseInt(this.storage.get("glimrTags_" + pixelId + "_lastUpdate"), 10);
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

  currentURLIdentifier: function() {
    if (window.document.location.hash && window.document.location.hash.indexOf("#!") !== -1) {
      return window.document.location.hash.replace("#!", "");
    } else {
      return window.document.location.pathname;
    }
  },

  _currentURLCacheKey: function() {
    if (this.state.currentURLCacheKey) {
      return this.state.currentURLCacheKey;
    } else {
      return md5(this.currentURLIdentifier()).substr(0, 10);
    }
  },

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

  _getOrUnmarshalCache: function(pixelId) {
    if (this.storage.isEnabled() && this.storage.get("glimrArticleTags_" + pixelId)) {
      this.state.urlCache[pixelId] = this._unmarshalTags(this.storage.get("glimrArticleTags_" + pixelId));
    }
    return this.state.urlCache[pixelId] || {};
  },

  _serializeTags: function(tags) {
    if (typeof tags === "object" && tags.constructor === Array) {
      return tags.join(",");
    } else {
      return constants.V2_PREFIX + GlimrSerialize.objectToQuery(tags);
    }
  },

  _deserializeTags: function(tagString) {
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

  _updateTagCache: function(pixelId, tags) {
    if (this.storage.isEnabled()) {
      this.storage.set("glimrTags_" + pixelId + "_lastUpdate", new Date().getTime());
      this.storage.set("glimrTags_" + pixelId, this._serializeTags(tags));
    }
  },

  _updateURLCache: function(pixelId, cache) {
    if (this.storage.isEnabled()) {
      this.storage.set("glimrArticleTags_" + pixelId, this._marshalTags(cache));
      this.storage.set("glimrArticleTags_" + pixelId + "_lastUpdate", new Date().getTime());
    }
    if (!this.state.urlCache[pixelId]) {
      this.state.urlCache[pixelId] = {};
    }
    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        this.state.urlCache[pixelId][key.substr(0, 10)] = cache[key];
      }
    }
  }
};

module.exports = TagCache;

},{"./constants":1,"./lib/md5":6,"./serialize":9}],12:[function(require,module,exports){
"use strict";

var functools = require("./lib/functools");
var objecttools = require("./lib/objecttools");
var md5 = require("./lib/md5");
var JSONP = require("./lib/jsonp");

var GlimrSerialize = require("./serialize");
var constants = require("./constants");

function missingParam(n, p) {
  return new TypeError("Parameter #" + n + " is required: " + p);
}

function GlimrTags(storage, tagCache, url, enrichment) {
  this.storage = storage;
  this.tagCache = tagCache;
  this.state = {
    loadingTags: {},
    loadedTags: {},
    currentURLCacheKey: false
  };
  this.networkRequests = 0;
  this.url = url;
  this.enrichment = enrichment;
}

GlimrTags.prototype = {
  getPixelLastUpdated: function(pixelId) {
    if (this.storage.isEnabled()) {
      return this.storage.get("glimrArticleTags_" + pixelId + "_lastUpdate") || false;
    } else {
      return false;
    }
  },

  getCachedURLTags: function(pixelId) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }
    var cachedTags = this.tagCache._getOrUnmarshalCache(pixelId);
    var cacheKey = this.tagCache._currentURLCacheKey();

    if (!cachedTags[cacheKey]) {
      cachedTags[cacheKey] = [];
    }

    return cachedTags[cacheKey];
  },

  getCachedBehaviorTags: function(pixelId) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    if (this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      return params[0];
    } else {
      return false;
    }
  },

  getCachedBehaviorTagsAndUpdateInBackground: function(pixelId, options) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    options = options || {};
    options.onUpdate = typeof options.onUpdate === "function" ? options.onUpdate : function() {};

    if (!this.tagCache.usesTagCache()) {
      if (window.console) {
        window.console.error("Caching not enabled. Enable with Glimr.setTagCacheTimeInSeconds(number)");
      }
      return [];
    }

    var cachedTags = this._getLocalTags(pixelId);

    if (!this.tagCache.isTagCacheValid(pixelId)) {
      this.getTags(pixelId, options.onUpdate);
    }

    return cachedTags[0] || false;
  },

  getTagsAndPushToDataLayer: function(pixelId, callback) {
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

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
    if (typeof pixelId === "undefined") {
      throw missingParam(0, "pixelId");
    }

    var pageCacheId = pixelId + this.tagCache._currentURLCacheKey();
    if (!this._needsToMakeRequest() && this.state.loadedTags[pageCacheId]) {
      var response = this.state.loadedTags[pageCacheId];
      callback(response[0], response[1]);
      return;
    }

    if (typeof this.state.loadingTags[pageCacheId] !== "undefined") {
      this.state.loadingTags[pageCacheId].push(callback);
      return;
    }

    this._requestTags(pixelId, pageCacheId, callback, functools.bindFunction(this, function(data) {
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
        this.tagCache._updateURLCache(pixelId, data.cache);
      }

      if (this.tagCache.usesTagCache()) {
        this.tagCache._updateTagCache(pixelId, toCache);
      }

      var cachedTags = this.getCachedURLTags(pixelId);
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

    }));
  },

  _getLocalTags: function(pixelId) {
    var storedTags = this.tagCache._deserializeTags(this.storage.get("glimrTags_" + pixelId));
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

  _requestTags: function(pixelId, pageCacheId, userCallback, parseCallback) {
    var pixelLastUpdated = this.getPixelLastUpdated(pixelId);

    if (!this._needsToMakeRequest() && this.tagCache.usesTagCache() && this.tagCache.isTagCacheValid(pixelId)) {
      var params = this._getLocalTags(pixelId);
      userCallback(params[0], params[1]);
      return;
    }

    var extraParams = "";
    if (pixelLastUpdated) {
      extraParams += "&keywords_last_updated=" + pixelLastUpdated;
    }

    if (window.document.location.hash) {
      extraParams += "&fragment=" + encodeURIComponent(window.document.location.hash);
    }

    extraParams += "&" + GlimrSerialize.objectToQuery(this.enrichment._flush());

    var requestUrl = (this.url.host + this.url.tags).replace(":id", pixelId) + "?id=0" + extraParams;

    this.state.loadingTags[pageCacheId] = [];
    this.state.loadingTags[pageCacheId].push(userCallback);

    this.networkRequests += 1;

    JSONP(requestUrl, parseCallback);
  },

  _needsToMakeRequest: function() {
    return this.enrichment._needsToFlush();
  }
};

module.exports = GlimrTags;

},{"./constants":1,"./lib/functools":4,"./lib/jsonp":5,"./lib/md5":6,"./lib/objecttools":7,"./serialize":9}]},{},[3])(3)
});
