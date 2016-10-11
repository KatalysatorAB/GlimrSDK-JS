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
