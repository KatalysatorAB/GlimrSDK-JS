# GlimrSDK-JS [![JavaScript](https://circleci.com/gh/KatalysatorAB/GlimrSDK-JS.svg?style=svg)](https://circleci.com/gh/KatalysatorAB/GlimrSDK-JS)

JavaScript SDK for glimr.io.

The current major version can be accessed from here:

- https://storage.googleapis.com/glimr-static/glimrsdk-js/3/glimr.min.js
- https://storage.googleapis.com/glimr-static/glimrsdk-js/3/glimr.js

We follow semver, so the above URL's are the ones you should use to include in your page. The exact version can be accessed from the full version string:

- https://storage.googleapis.com/glimr-static/glimrsdk-js/3.3.3/glimr.min.js
- https://storage.googleapis.com/glimr-static/glimrsdk-js/3.3.3/glimr.js

## Usage

### Including

The SDK exposes a Global instance named `Glimr`. If you are using `browserify` or any similar bundling solutions, what you need to do is simply:

```js
var Glimr = require("glimr-sdk");
```

### .getTags

`Glimr.getTags( clientId: string, callback: (Array<string>, Object) => void ): void`

Fetch all tags associated with the current browser client. The callback should accept 1 array and 1 object parameter. Depending on the version of the Glimr API used, the object parameter might be empty.

```js
Glimr.getTags("YOUR_CLIENT_ID", function(tags, tagMappings) {
  console.log("Tags for client:", tags);
  console.log("... :", tagMappings);
});
```

The object is simply the array of tags but with mappings of meanings. The response might be:

```js
tags = ["apple", "banana", "orange"];
tagMappings = {
  yellow: ["banana", "orange"],
  red: ["apple"]
};
```

_Note:_ The `getTags`-call is cached for the duration of the page load. So calling it multiple times will only result in one call to the Glimr servers. The cache is cleared on page refresh.

### .setTagCacheTimeInSeconds

`Glimr.setTagCacheTimeInSeconds( desiredSecondsToCache: number ): number`
`Glimr.getTagCacheTimeInSeconds( ): number`

The tags from `Glimr.getTags` can be cached for a duration of up to 5 minutes. The tags don't change too often so it's a good idea to limit network traffic on the client.

```js
Glimr.setTagCacheTimeInSeconds(300);

// Max cache time is 5 minutes because otherwise you risk losing tags
// Passing anything > 300 will become 300
Glimr.setTagCacheTimeInSeconds(600);
console.log(Glimr.getTagCacheTimeInSeconds());
// ... 300
```

### .setTagCacheFallback

`Glimr.setTagCacheFallback( desiredSecondsToCache: number ): number`
`Glimr.setTagCacheFallback( ): number`

The tags from `Glimr.getTags` can be cached for a duration of up to 5 minutes. The tags don't change too often so it's a good idea to limit network traffic on the client.

```js
var mapping = [
    ["glco_", "glmu_"],
    ["glmu_", "glci_"],
    ["glci_", "gldi_"],
]

Glimr.setTagCacheFallback(86400, mapping);

// Max fallback time is 24h, after that fallback will be reset
// Passing anything > 86 400(24h) will become 86 400(24h)
Glimr.setTagCacheFallback(99999, mapping);
console.log(Glimr.getFallbackTimeInSeconds());
// ... 86400
console.log(Glimr.getFallbackMapping());
//[
//  ["glco_", "glmu_"],
//  ["glmu_", "glci_"],
//  ["glci_", "gldi_"],
//]
```

The tags are currently only stored in `localStorage`. If `localStorage` is not available on the client no caching will happen.

### .getCachedURLTags

`Glimr.getCachedURLTags( clientId: string ): Array<string>`

Glimr crawls your web property and knows which URL indicates a set of tags, based on filters you setup in the dashboard. The Glimr SDK can download and cache this database in an efficiant manner, and you can use it to get tags without having to make a network request. To fetch the tags associated with the current browser URL you call `Glimr.getCachedURLTags` which does a fast synchronous lookup.

```js
var tags = Glimr.getCachedURLTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

**Note:** This method used to be called `.getCachedTags`. For backwards compatibility it will exist until the next major release.

### .getCachedBehaviorTags

`Glimr.getCachedBehaviorTags( clientId: string ): Array<string> | boolean`

If `Glimr.setTagCacheTimeInSeconds` has been called this method can be used to peek into the cache without calling `Glimr.getTags`. If the cache is still valid, an array will be returned, otherwise `false`.

**Note:** This returns a different class of tags than `Glimr.getCachedURLTags`. Behavior tags are based on the user and not the current web URL.

```js
var tags = Glimr.getCachedBehaviorTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

### .getCachedFallbackTags

`Glimr.getCachedFallbackTags( clientId: string ): Array<string> | boolean`

If `Glimr.setTagCacheFallback` has been called this method can be used to peek into the fallback cache. If the cache is still valid, an array will be returned, otherwise `false`.

```js
var tags = Glimr.getCachedBehaviorTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

### .getCachedBehaviorTagsAndUpdateInBackground

`Glimr.getCachedBehaviorTagsAndUpdateInBackground( clientId: string, options: { onUpdate: (tags: Array) => void}): Array<string>`

For some implementors tags need to be used in a synchronous manner, but still need to be updated when possible. Also invalidated tags should still be used. This method works for that use case.


```javascript
Glimr.setTagCacheTimeInSeconds(300);
var tags = Glimr.getCachedBehaviorTagsAndUpdateInBackground("PIXEL_ID");

// An optional options object can be passed in with an `onUpdate` callback that is passed as a callback to the `Glimr.getTags` call

var tags = Glimr.getCachedBehaviorTagsAndUpdateInBackground("PIXEL_ID", {
  onUpdate: function(tags) {
    console.log("tags are updated. New tags", tags);
  }
});
```

### .getTagsAndPushToDataLayer

`Glimr.getTagsAndPushToDataLayer( clientId: string ): void`

Does the same calls as `Glimr.getTags`, but instead of a callback it simply pushes the tags to the global variable named `dataLayer`, which Google Tag Manager uses.

```js
Glimr.getTagsAndPushToDataLayer("YOUR_CLIENT_ID");
```

## Sending tags to an ad server

Your glimr tags will live very happily in your ad server. To get there, they need to be encoded in a compliant manner. This library provides some tools to make that easy.

The biggest hurdle is how to encode your tags. Since they might come back as an array of strings, or a dictionary of arrays, we have tools to encode both into HTTP spec compliant query strings.

### .objectToQuery

`Glimr.objectToQuery( value: any ): string`

Take an object/dictionary and convert to a query string. It will not modify array keys (postfix them with `[]`), that is up to the implementer to make sure the keys are postfix'd.

```javascript
var tags = {
  key1: "value",
  key2: ["foo", "bar"],
  "key3[]": ["baz", "bam"]
};

var queryString = Glimr.objectToQuery(tags);

// key1=value&key2=foo&key2=bar&key3%5B%5D=baz&key3%5B%5D=bam
```

### .arrayToQuery

`Glimr.arrayToQuery( value: Array, key: string ): string`

Take an array and convert to a query string. The second argument is a string of which will become key for the values.

It will not modify keys like other frameworks might (i.e postfix them with `[]`), that is up to the implementer to make sure the keys are postfix'd.

```javascript
var tags = ["a", "bcd", "ef"];

var queryString = Glimr.arrayToQuery(tags, "my_key");

// my_key=a&my_key=bcd&my_key=ef
```

### .queryToObject

`Glimr.queryToObject( queryString: string ): Object`

Parse a query string into an object. Since multiple entries are supported per key, it always creates an array key. For example:

```javascript
var queryString = "foo=bar&foo=baz&hello=world";

var object = Glimr.queryToObject("foo=bar&foo=baz&hello=world");

/*
{
  foo: ["bar", "baz"],
  hello: ["world"] // note that hello is also an array
}
*/
```

### .escapeStringForQuery

`Glimr.escapeStringForQuery( value: string ): string`

This is more of a helper that might be useful for very custom stuff. It's what `Glimr.objectToQuery` and `Glimr.arrayToQuery` use to encode the values.

Usage is easy:

```javascript
var escapedString = Glimr.escapeStringForQuery("hello world");

// hello%20world
```

### .unescapeStringForQuery

`Glimr.unescapeStringForQuery( value: string ): string`

Does the opposite of `Glimr.escapeStringForQuery`:

```javascript
var string = Glimr.escapeStringForQuery("hello%20world");

// hello world
```

## Google Tag Manager

Google Tag Manager is supported out of the box. All you need to do is create a custom HTML tag with the following snippet.

```html
<script src="https://storage.googleapis.com/glimr-static/glimrsdk-js/3/glimr.min.js"></script>
<script>
Glimr.getTagsAndPushToDataLayer("YOUR_CLIENT_ID");
</script>
```

*Note*: Be sure to replace `YOUR_CLIENT_ID` with the web pixel ID from the Glimr Dashboard.

When activated the tag will fetch tags from Glimr and push them to the data layer. To use these tags when available, you create a new Trigger that triggers on the event named `glimr.tags`.

![](https://storage.googleapis.com/glimr-static/glimrsdk-js/screenshots/event.png)

The tags are then available under the `dataLayer` variable `glimrTags`. Recommended is to create variable for it:

![](https://storage.googleapis.com/glimr-static/glimrsdk-js/screenshots/variable.png)

To use the variable in a custom HTML-tag you use the `{{}}`-notation:

```html
<script>
var glimrTags = {{glimrTags}};
alert("Glimr tags: " + glimrTags.join(", "));
</script>
```

**Note**: Pre-requisite for this is that a custom variable has been added as per the aforementioned screenshot.

## Enrichment

You can enrich your own data in Glimr by passing in values for aggregation by the Glimr cloud. Currently only user position is supported. All values defined need to be flushed back to our servers. This is done with a call to `Glimr.getTags`.

### .storePosition

`Glimr.storePosition( position: { longitude: number | string, latitude: number | string } ): void`

This signals the position of the user. The passed in object must have numeric `longitude` and `latitude` members. They can either be numbers or strings that can be parsed with `parseFloat`.

**Note:** Stored values are not stored until flushed by a call to `Glimr.getTags`. See the example below to learn how to use it.

### Example

Here is an example using `navigator.geolocation` to ask for local news.

```javascript
// <a onclick="getPosition()" href="javascript:void(0)">Do you want local news and weather?</a>

function getPosition() {
  navigator.geolocation.getCurrentPosition(function(position) {
    // Store position
    Glimr.storePosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });

    // Flush position with request to server
    Glimr.getTags("YOURID", function(tags) {
      // use new possibly more accurate tags
      console.log("Tags are now", tags);
    });
  });
}
```

## Development

### Installation

```bash
git clone git@github.com:KatalysatorAB/GlimrSDK-JS.git
cd GlimrSDK-JS
npm install
```

### Testing

```bash
npm install -g testem phantomjs-prebuilt
npm run testrunner
```

### Building for production

```bash
npm run dist # will output to dist/glimr.min.js - works only on Unix based systems
npm run dist:windows # will output to dist/glimr.min.js - works only on Windows
```
