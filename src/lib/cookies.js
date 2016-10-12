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
