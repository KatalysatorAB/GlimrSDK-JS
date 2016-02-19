describe('tags', function(){
  beforeEach(function() {
    setupGlimr();
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
    var isDone = false;
    var tags;

    Glimr.url.host = "http://this-does-not-exist.org";

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

  it('should return thing by calling it twice in succession', function() {
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
});
