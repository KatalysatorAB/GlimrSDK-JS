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
      var glimrTags = Glimr.tagCache._unmarshalTags(localStorage["glimrArticleTags_" + "keywords_cache_normal"]);
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
      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

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
      clearGlimrState();

      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

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
      var cachedTags = Glimr.tagCache._unmarshalTags(localStorage["glimrArticleTags_" + "keywords_cache_normal"])["6666cd76f9"];
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
      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

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
      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen

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

  it('should be able to fetch tags from cache and respond the same thing when called multiple times', function() {
    var isDone = false;
    var tags;

    // Fetch tags normally
    runs(function() {
      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen
      Glimr.setTagCacheTimeInSeconds(300);

      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      clearGlimrState();
      Glimr.tagCache.state.currentURLCacheKey = "6666cd76f9"; // Check the keywords_cache_normal to see why this value was chosen
      Glimr.setTagCacheTimeInSeconds(300);
    });

    // Try to fetch tags 3 times
    for (var i = 0; i < 3; i++) {
      runs(function() {
        isDone = false;

        Glimr.getTags("keywords_cache_normal", function(fetchedTags, b) {
          isDone = true;
          tags = fetchedTags;
        });
      });

      waitsFor(function() {
        return isDone;
      });
    }

    runs(function() {
      expect(tags.length).toBe(4);
      expect(tags).toContain("tag_1");
      expect(tags).toContain("tag_2");
      expect(tags).toContain("tag_10");
      expect(tags).toContain("tag_12");
    });
  });

  it('should work with cache when response is mapped', function() {
    var isDone = false;
    var tags;

    // Fetch tags normally
    runs(function() {
      Glimr.setTagCacheTimeInSeconds(300);

      Glimr.getTags("with_mappings", function(fetchedTags) {
        isDone = true;
        tags = fetchedTags;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(1);
      expect(tags).toContain("apple");

      clearGlimrState();
      Glimr.setTagCacheTimeInSeconds(300);
    });

    runs(function() {
      isDone = false;

      Glimr.getTags("with_mappings", function(fetchedTags, b) {
        isDone = true;
        tags = fetchedTags;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(1);
      expect(tags).toContain("apple");
    });
  });

  it("should make network requests if navigated to different URL", function() {
    var isDone = false;
    var tags;

    // Fetch tags normally
    runs(function() {
      document.location.hash = "#!/";
      Glimr.setTagCacheTimeInSeconds(300);
      Glimr.getTags("keywords_cache_normal", function(fetchedTags) {
        isDone = true;
        tags = fetchedTags;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(4);
      expect(tags).toContain("tag_10");
      expect(tags).toContain("tag_12");
      expect(tags).toContain("tag_1");
      expect(tags).toContain("tag_2");

      // Simulate in-page navigation
      document.location.hash = "#!/example/path";

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
      expect(tags.length).toBe(3);
      expect(tags).toContain("tag_10");
      expect(tags).toContain("tag_12");
      expect(tags).toContain("/example/path");
    });
  });

  it("should be able to cache tags and respond synchronously", function() {
    var fetchedTags;
    var isDone;

    function simulatePageReload() {
      clearGlimrState();
      setupGlimrMockServer();
      Glimr.setTagCacheTimeInSeconds(3);
    }

    runs(function() {
      Glimr.setTagCacheTimeInSeconds(3);

      isDone = false;
      var tags = Glimr.getCachedBehaviorTagsAndUpdateInBackground("with_banana_orange_apple", {
        onUpdate: function(tags) {
          fetchedTags = tags;
          isDone = true;
        }
      });

      // First load no tags are loaded
      expect(tags.length).toBe(0);
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(fetchedTags.length).toBe(3);
      expect(fetchedTags).toContain("banana");
      expect(fetchedTags).toContain("orange");
      expect(fetchedTags).toContain("apple");
    });

    runs(function() {
      simulatePageReload();

      Glimr.setTagCacheTimeInSeconds(3);

      var tags = Glimr.getCachedBehaviorTagsAndUpdateInBackground("with_banana_orange_apple", {
        onUpdate: function(tags) {
          throw new Error("Should not be called");
        }
      });

      // Second page load load tags exist
      expect(tags.length).toBe(3);
      expect(tags).toContain("banana");
      expect(tags).toContain("orange");
      expect(tags).toContain("apple");

      isDone = false;
      setTimeout(function() {
        isDone = true;
      }, 5000);
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      simulatePageReload();

      Glimr.setTagCacheTimeInSeconds(3);

      isDone = false;
      var tags = Glimr.getCachedBehaviorTagsAndUpdateInBackground("with_banana_orange_apple", {
        onUpdate: function(tags) {
          fetchedTags = tags;
          isDone = true;
        }
      });

      // Second page load load tags exist
      expect(tags.length).toBe(3);
      expect(tags).toContain("banana");
      expect(tags).toContain("orange");
      expect(tags).toContain("apple");
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(fetchedTags.length).toBe(3);
      expect(fetchedTags).toContain("banana");
      expect(fetchedTags).toContain("orange");
      expect(fetchedTags).toContain("apple");
    });
  })
});
