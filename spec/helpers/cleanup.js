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
