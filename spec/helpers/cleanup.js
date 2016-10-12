function clearGlimrValues() {
  clearGlimrState();

  // Nuke localStorage
  Object.keys(localStorage).forEach(function(key) {
    localStorage.removeItem(key);
  });
}

function clearGlimrState() {
  Glimr = new Glimr.constructor;
}

function unsetAllCookies() {
  document.cookie.split(";").forEach(function(cookie) {
    document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(1000).toUTCString() + ";path=/");
  });
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
