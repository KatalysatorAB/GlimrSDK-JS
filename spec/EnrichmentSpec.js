"use strict";

describe("glimr_id", function() {
  beforeEach(function() {
    clearGlimrValues();
    setupGlimrMockServer();
  });

  it("should send enrichment data in tags call", function() {
    var isDone = false;
    var tags;

    runs(function() {
      Glimr.storePosition({ longitude: 51.22, latitude: 23.00 });
      Glimr.getTags("echo_enrichment", function(fetchedTags) {
        isDone = true;
        tags = fetchedTags;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.u_pos).toEqual("23,51.22");
    });
  });

  it("should make tag call even if tags are cached", function() {
    var isDone = false;
    var tags;

    runs(function() {
      Glimr.setTagCacheTimeInSeconds(300);
      isDone = false;
      Glimr.getTags("echo_enrichment", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      Glimr.storePosition({ longitude: 51.22, latitude: 23.00 });
      isDone = false;
      Glimr.getTags("echo_enrichment", function() {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(Glimr.tags.networkRequests).toEqual(2);
    });
  });

  it("throw error on invalid data", function() {
    var invalidError = new Error("Glimr.storePosition requires one argument, an object with a numeric .longitude and .latitude");

    expect(function() {
      Glimr.storePosition(51, 23);
    }).toThrow(invalidError);

    expect(function() {
      Glimr.storePosition({ lng: 51, lat: 23 });
    }).toThrow(invalidError);

    expect(function() {
      Glimr.storePosition({ latitude: 53 });
    }).toThrow(invalidError);

    expect(function() {
      Glimr.storePosition({ longitude: 23 });
    }).toThrow(invalidError);

    expect(function() {
      Glimr.storePosition({ longitude: "23", latitude: "51" });
    }).not.toThrow(invalidError);
  });
});
