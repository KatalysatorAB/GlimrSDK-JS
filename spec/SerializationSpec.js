"use strict";

describe('serialization', function(){
  it('should serialize array tags', function() {
    // Setup
    var tags = ["a", "b", "c"];

    // Act
    var queryString = Glimr.arrayToQuery(tags, "key");

    // Verify
    expect(queryString).toBe("key=a&key=b&key=c");
  });

  it('should serialize dictionary tags', function() {
    // Setup
    var tags = {
      key1: ["a", "b"],
      key2: ["c"]
    };

    // Act
    var queryString = Glimr.objectToQuery(tags);

    // Verify
    expect(queryString).toBe("key1=a&key1=b&key2=c");
  });

  it('should serialize mixed dictionary array tags', function() {
    // Setup
    var tags = {
      key1: ["a", "b"],
      key2: ["c"],
      key3: "hello world"
    };

    // Act
    var queryString = Glimr.objectToQuery(tags);

    // Verify
    expect(queryString).toBe("key1=a&key1=b&key2=c&key3=hello%20world");
  });

  it('should escape weird characters', function() {
    // Setup
    var objectDictionaryArray = {
      key1: ["& []?'\"", "&åäö"],
      "key2[]": ["123"],
      " ö %&": ["123"]
    };

    var objectDictionary = {
      key1: "& []?",
      "key2[]": "123"
    };

    var arrayValues = ["& []?", "132&?"];

    // Act
    var objectDictionaryArrayString = Glimr.objectToQuery(objectDictionaryArray);
    var objectDictionaryString = Glimr.objectToQuery(objectDictionary);
    var arrayValuesString = Glimr.arrayToQuery(arrayValues, "key");

    // Verify
    expect(objectDictionaryArrayString).toBe("key1=%26%20%5B%5D%3F'%22&key1=%26%C3%A5%C3%A4%C3%B6&key2%5B%5D=123&%20%C3%B6%20%25%26=123");
    expect(objectDictionaryString).toBe("key1=%26%20%5B%5D%3F&key2%5B%5D=123");
    expect(arrayValuesString).toBe("key=%26%20%5B%5D%3F&key=132%26%3F");
  });
});
