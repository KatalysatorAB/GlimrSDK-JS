describe('tag_cache', function() {
  // These tests use the public `Glimr.getTags` and then verify by checking localStorage

  beforeEach(function() {
    clearGlimrValues();
    setupGlimrMockServer();
  });

  it('should fetch a cache structure of tags', function() {
    var isDone = false;

    runs(function() {
      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(typeof localStorage["glimrArticleTags_" + "keywords_cache_normal"]).toBe("string");
    });
  });

  it('should store a cache structure in local storage', function() {
    var isDone = false;

    runs(function() {
      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      var glimrTags = Glimr._unmarshalTags(localStorage["glimrArticleTags_" + "keywords_cache_normal"]);
      expect(glimrTags["6666cd76f9"].length).toBe(2);
      expect(glimrTags["6666cd76f9"]).toContain("tag_1");
      expect(glimrTags["6666cd76f9"]).toContain("tag_2");

      expect(glimrTags["d41d8cd98f"].length).toBe(2);
      expect(glimrTags["d41d8cd98f"]).toContain("tag_3");
      expect(glimrTags["d41d8cd98f"]).toContain("tag_4");

      expect(glimrTags["752efa2ae3"].length).toBe(2);
      expect(glimrTags["752efa2ae3"]).toContain("tag_5");
      expect(glimrTags["752efa2ae3"]).toContain("tag_6");
    });
  });

  it('should be able to fetch tags from cache', function() {
    var isDone = false;
    var tags;

    // Fetch tags normally
    runs(function() {
      Glimr.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    // Try to fetch tags when server crashed
    runs(function() {
      setupGlimrCrashedServer();
      delete Glimr.state.loadedTags["keywords_cache_normal"];

      isDone = false;

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
        tags = fetchedTags;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      var cachedTags = Glimr._unmarshalTags(localStorage["glimrArticleTags_" + "keywords_cache_normal"])["6666cd76f9"];
      expect(cachedTags.length).toBe(2);
      expect(cachedTags).toContain("tag_1");
      expect(cachedTags).toContain("tag_2");

      expect(tags.length).toBe(2);
      expect(tags).toContain("tag_1");
      expect(tags).toContain("tag_2");
    });
  });

  it("should keep tags separate by pixelId", function() {
    var isDone1 = false;
    var isDone2 = false;
    var tags1;
    var tags2;

    // Fetch tags normally
    runs(function() {
      Glimr.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone1 = true;
      });

      Glimr.getTags("keywords_cache_other", function(fetchedTags) {
        isDone2 = true;
      });
    });

    waitsFor(function() {
      return isDone1 && isDone2;
    });

    // Try to fetch tags when server crashed
    runs(function() {
      isDone1 = false;
      isDone2 = false;

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        tags1 = fetchedTags;
        isDone1 = true;
      });

      Glimr.getTags("keywords_cache_other", function(fetchedTags) {
        tags2 = fetchedTags;
        isDone2 = true;
      });
    });

    waitsFor(function() {
      return isDone1 && isDone2;
    });

    runs(function() {
      expect(tags1.length).toBe(4);
      expect(tags1).toContain("tag_1");
      expect(tags1).toContain("tag_2");
      expect(tags1).toContain("tag_10");
      expect(tags1).toContain("tag_12");

      expect(tags2.length).toBe(3);
      expect(tags2).toContain("le_tag");
      expect(tags2).toContain("el_tag");
      expect(tags2).toContain("a_tag");
    });
  });

  it("should work without localStorage", function() {
    Glimr.useLocalStorage = false;

    var isDone = false;
    var tags;

    runs(function() {
      Glimr.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(localStorage["glimrArticleTags_" + "keywords_cache_normal"]).toBeUndefined();

      Glimr.useLocalStorage = true;

      expect(tags.length).toBe(4);
      expect(tags).toContain("tag_10");
      expect(tags).toContain("tag_12");
      expect(tags).toContain("tag_1");
      expect(tags).toContain("tag_2");
    });
  });
});
