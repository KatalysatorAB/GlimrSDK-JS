"use strict";

describe('glimr_id', function() {
  beforeEach(function() {
    unsetAllCookies();
    clearGlimrValues();
    setupGlimrMockServer();
  });

  afterEach(function() {
    unsetAllCookies();
  });

  function simulatePageReload() {
    clearGlimrState();
    setupGlimrMockServer();
  }

  it('should set a glimr id on page load', function() {
    var isDone = false;

    runs(function() {
      isDone = false;
      Glimr.getTags("empty", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(getCookie("__glmrid")).not.toBeNull();
    });
  });

  it('should set a retain glimr id on second page load', function() {
    var isDone = false;
    var cookieValue;

    runs(function() {
      isDone = false;
      Glimr.getTags("empty", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      cookieValue = getCookie("__glmrid");
      simulatePageReload();

      isDone = false;
      Glimr.getTags("empty", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(getCookie("__glmrid")).toEqual(cookieValue);
    });
  });

  it('should set reset glimr ID if backend says different', function() {
    var isDone = false;
    var cookieValue;

    runs(function() {
      isDone = false;
      Glimr.getTags("with_glimr_id", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(getCookie("__glmrid")).toEqual("this-is-my-id-now");
    });
  });
});
