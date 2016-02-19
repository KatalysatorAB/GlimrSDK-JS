function setupGlimrMockServer() {
  Glimr.url.host = "http://localhost:51115";
}

function setupGlimrCrashedServer() {
  Glimr.url.host = "http://this-does-not-exist.org";
}
