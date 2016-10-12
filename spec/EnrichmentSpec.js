"use strict";

describe("glimr_id", function() {
  beforeEach(function() {
    clearGlimrValues();
    setupGlimrMockServer();
  });

  it("it send enrichment data in tags call", function() {
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
      expect(tags.position.longitude).toEqual("51.22");
      expect(tags.position.latitude).toEqual("23");
    });
  });

  it("throw error on invalid data", function() {
    var invalidError = new Error("Glimr.storePosition requires one argument, an object with a numeric .latitude and .longitude");

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
    }).toThrow(invalidError);
  });
});
