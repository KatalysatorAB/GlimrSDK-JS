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
