(function(window) {
  "use strict";

  var GLIMR_URL = "//pixel.glimr.io/v3/iptags/:id/";

  var Glimr = {
    _loadedTags: {},
    _loadingTags: {},

    JSONP: function(url, callback) {
      var timestamp = new Date().getTime();
      var generatedFunction = "glmrjsonp" + Math.round(timestamp + Math.random() * 1000001);

      window[generatedFunction] = function(json){
        callback(json);

        try {
          delete window[generatedFunction];
        } catch(e) {
          window[generatedFunction] = undefined;
        }

        try {
          jsonpScript.parentNode.removeChild(jsonpScript);
        } catch (e) { }
      };

      url += (url.indexOf("?") === -1) ? "?" : "&";
      url += "callback=" + generatedFunction;

      var jsonpScript = document.createElement("script");
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
        d = Math.floor(d/16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    },

    initGlimrId: function() {
      Glimr.glimrId = Glimr.readCookie("__glmrid");
      if (!Glimr.glimrId) {
        Glimr.glimrId = Glimr.generateUUID();
        Glimr.setCookie();
      }
    },

    setCookie: function() {
      Glimr.createCookie("__glmrid", Glimr.glimrId);
    },

    getTags: function(pixelId, callback) {
      if (typeof Glimr._loadedTags[pixelId] !== "undefined") {
        callback(Glimr._loadedTags[pixelId]);
        return;
      }

      if (typeof Glimr._loadingTags[pixelId] !== "undefined") {
        Glimr._loadingTags[pixelId].push(callback);
        return;
      }

      Glimr._loadingTags[pixelId] = [];

      try {
        Glimr.initGlimrId();

        Glimr.JSONP(GLIMR_URL.replace(":id", pixelId) + "?id=" + Glimr.glimrId, function(data) {
          var tags = [];
          if (data && data.tags) {
            tags = data.tags;
          }

          Glimr._loadedTags[pixelId] = tags;

          var callbacks = Glimr._loadingTags[pixelId];
          for (var i = 0; i < callbacks.length; i += 1) {
            callbacks[i](tags);
          }

          delete Glimr._loadingTags[pixelId];

          if (typeof data.id === "string" && data.id !== Glimr.glimrId) {
            Glimr.glimrId = data.id;
            Glimr.setCookie();
          }
        });
      } catch (e) {
        callback([]);
      }
    }
  };

  window.Glimr = Glimr;
})(window);
