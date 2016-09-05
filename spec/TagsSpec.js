describe('tags', function(){
  beforeEach(function() {
    clearGlimrValues();
    setupGlimrMockServer();
  });

  it('should fetch a list of tags for a publisher id', function() {
    var isDone = false;
    var tags;

    runs(function() {
      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(3);
      expect(tags).toContain("banana");
      expect(tags).toContain("orange");
      expect(tags).toContain("apple");
    });
  });

  it('should fetch a dictionary of tags for a publisher id', function() {
    var isDone = false;
    var tagMappings;

    runs(function() {
      Glimr.getTags("with_dictionary_key_values", function(x, fetchedTagMappings) {
        tagMappings = fetchedTagMappings;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tagMappings.key1).toContain("apple");
      expect(tagMappings.key1).toContain("banana");
      expect(tagMappings.key2).toBe("orange");
      expect(tagMappings.key3).toContain("sugar");
    });
  });

  it('should fetch an empty list of tags when no tags are found', function() {
    var isDone = false;
    var tags;

    runs(function() {
      Glimr.getTags("empty", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(0);
      expect(tags.constructor).toBe(Array);
    });
  });

  it('should return an empty list of tags when the api is down', function() {
    setupGlimrCrashedServer();

    var isDone = false;
    var tags;

    runs(function() {
      Glimr.getTags("empty", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(0);
      expect(tags.constructor).toBe(Array);
    });
  });

  it('should return an empty list of tags when a bad publisher is sent', function() {
    var isDone = false;
    var tags;

    Glimr.url.host = "http://this-does-not-exist.org";

    runs(function() {
      Glimr.getTags("publisher_id_is_null", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(0);
      expect(tags.constructor).toBe(Array);
    });
  });

  it('should return the same array by calling it twice in succession', function() {
    var isDone = false;
    var tags;

    runs(function() {
      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(3);
      expect(tags).toContain("banana");
      expect(tags).toContain("orange");
      expect(tags).toContain("apple");

      isDone = false;
    });

    runs(function() {
      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        tags = fetchedTags;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tags.length).toBe(3);
      expect(tags).toContain("banana");
      expect(tags).toContain("orange");
      expect(tags).toContain("apple");

      isDone = false;
    });
  });

  it('should return the same dictionary by calling it twice in succession', function() {
    var isDone = false;
    var tagMappings;

    runs(function() {
      Glimr.getTags("with_dictionary_key_values", function(x, fetchedTagMappings) {
        tagMappings = fetchedTagMappings;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tagMappings.key1).toContain("apple");
      expect(tagMappings.key1).toContain("banana");
      expect(tagMappings.key2).toBe("orange");
      expect(tagMappings.key3).toContain("sugar");

      isDone = false;
    });

    runs(function() {
      Glimr.getTags("with_dictionary_key_values", function(_, fetchedTagMappings) {
        tagMappings = fetchedTagMappings;
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tagMappings.key1).toContain("apple");
      expect(tagMappings.key1).toContain("banana");
      expect(tagMappings.key2).toBe("orange");
      expect(tagMappings.key3).toContain("sugar");

      isDone = false;
    });
  });

  it('should return thing by calling it twice async', function() {
    var isDone1 = false;
    var isDone2 = false;
    var tags1;
    var tags2;

    runs(function() {
      Glimr.getTags("with_banana_orange_apple", function(fetchedTags1) {
        tags1 = fetchedTags1;
        isDone1 = true;
      });

      Glimr.getTags("with_banana_orange_apple", function(fetchedTags2) {
        tags2 = fetchedTags2;
        isDone2 = true;
      });
    });

    waitsFor(function() {
      return isDone1 && isDone2;
    });

    runs(function() {
      expect(tags1).toEqual(tags2);

      expect(tags1.length).toBe(3);
      expect(tags1).toContain("banana");
      expect(tags1).toContain("orange");
      expect(tags1).toContain("apple");
    });
  });

  it('should be able to cache for max 5 minutes', function() {
    Glimr.setTagCacheTimeInSeconds(600);

    expect(Glimr.getTagCacheTimeInSeconds()).toBe(300);
  });

  it('should be able to cache a response for a time', function() {
    var isDone = false;

    var networkRequests = 0;

    var fetchedTags1;
    var fetchedTags2;
    var fetchedTags3;

    function simulatePageReload() {
      clearGlimrState();
      setupGlimrMockServer();
      Glimr.setTagCacheTimeInSeconds(2);
    }

    simulatePageReload();

    // Make initial fetch with no cache
    runs(function() {
      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        isDone = true;
        fetchedTags1 = fetchedTags;

        networkRequests += Glimr.networkRequests;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    // Make a second request immediately after on a reloaded page
    // This should hit cache
    runs(function() {
      simulatePageReload();

      isDone = false;

      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        isDone = true;
        fetchedTags2 = fetchedTags;

        expect(fetchedTags.length).toEqual(3);
        expect(fetchedTags).toContain("apple");
        expect(fetchedTags).toContain("orange");
        expect(fetchedTags).toContain("banana");

        var syncTags = Glimr.getCachedBehaviorTags("with_banana_orange_apple");

        expect(syncTags.length).toEqual(3);
        expect(syncTags).toContain("apple");
        expect(syncTags).toContain("orange");
        expect(syncTags).toContain("banana");

        networkRequests += Glimr.networkRequests;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    // Sleep 3 seconds
    runs(function() {
      isDone = false;
      setTimeout(function() {
        isDone = true;
      }, 3000);
    });

    waitsFor(function() {
      return isDone;
    });

    // Make third request, which should hit servers
    runs(function() {
      simulatePageReload();
      isDone = false;

      Glimr.getTags("with_banana_orange_apple", function(fetchedTags) {
        isDone = true;
        fetchedTags3 = fetchedTags;

        networkRequests += Glimr.networkRequests;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(fetchedTags1).toEqual(fetchedTags2);
      expect(fetchedTags1).toEqual(fetchedTags3);

      expect(networkRequests).toEqual(2);
    });
  });

  it('should be able to fetch dictionary tags from cache', function() {
    var isDone = false;
    var tagMappings;

    // Fetch tags normally
    runs(function() {
      Glimr.setTagCacheTimeInSeconds(300);

      Glimr.getTags("with_dictionary_key_values", function(fetchedTags) {
        isDone = true;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    // Try to fetch tags when server crashed
    runs(function() {
      setupGlimrCrashedServer();
      Glimr.state = {};
      Glimr.initialize();

      isDone = false;

      Glimr.setTagCacheTimeInSeconds(300);
      Glimr.getTags("with_dictionary_key_values", function(_, fetchedTagMappings) {
        isDone = true;
        tagMappings = fetchedTagMappings;
      });
    });

    waitsFor(function() {
      return isDone;
    });

    runs(function() {
      expect(tagMappings.key1).toContain("apple");
      expect(tagMappings.key1).toContain("banana");
      expect(tagMappings.key2).toContain("orange");
      expect(tagMappings.key3).toContain("sugar");
    });
  });

});
