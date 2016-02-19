function clearGlimrValues() {
  Object.keys(Glimr).forEach(function(key) {
    if (/^_/.test(key) && typeof Glimr[key] === "object") {
      delete Glimr[key];
    }
  });

  // Nuke localStorage
  Object.keys(localStorage).forEach(function(key) {
    localStorage.removeItem(key);
  });
}
