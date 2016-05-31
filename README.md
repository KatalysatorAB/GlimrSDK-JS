# GlimrSDK-JS

JavaScript SDK for glimr.io.

The current version can be accessed from here:

- https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.1/glimr.min.js
- https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.1/glimr.js

## Usage

### .getTags

`void Glimr.getTags( string clientId, function(array) callback )`

Fetch all tags associated with the current browser client.

```js
Glimr.getTags("YOUR_CLIENT_ID", function(tags) {
  console.log("Tags for client:", tags);
});
```

_Note:_ The `getTags`-call is cached for the duration of the page load. So calling it multiple times will only result in one call to the Glimr servers. The cache is cleared on page refresh.

### .setTagCacheTimeInSeconds

`number Glimr.setTagCacheTimeInSeconds( number desiredSecondsToCache )`
`number Glimr.getTagCacheTimeInSeconds( )`

The tags from `Glimr.getTags` can be cached for a duration of up to 5 minutes. The tags don't change too often so it's a good idea to limit network traffic on the client.

```js
Glimr.setTagCacheTimeInSeconds(300);

// Max cache time is 5 minutes because otherwise you risk losing tags
// Passing anything > 300 will become 300
Glimr.setTagCacheTimeInSeconds(600);
console.log(Glimr.getTagCacheTimeInSeconds());
// ... 300
```

The tags are currently only stored in `localStorage`. If `localStorage` is not available on the client no caching will happen.

### .getCachedURLTags

`array Glimr.getCachedURLTags( string clientId )`

Glimr crawls your web property and knows which URL indicates a set of tags, based on filters you setup in the dashboard. The Glimr SDK can download and cache this database in an efficiant manner, and you can use it to get tags without having to make a network request. To fetch the tags associated with the current browser URL you call `Glimr.getCachedURLTags` which does a fast synchronous lookup.

```js
var tags = Glimr.getCachedURLTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

**Note:** This method used to be called `.getCachedTags`. For backwards compatibility it will exist until the next major release.

### .getTagsAndPushToDataLayer

`void Glimr.getTagsAndPushToDataLayer( string clientId )`

Does the same calls as `Glimr.getTags`, but instead of a callback it simply pushes the tags to the global variable named `dataLayer`, which Google Tag Manager uses.

```js
Glimr.getTagsAndPushToDataLayer("YOUR_CLIENT_ID");
```

## Sending tags to an ad server

Your glimr tags will live very happily in your ad server. To get there, they need to be encoded in a compliant manner. This library provides some tools to make that easy.

The biggest hurdle is how to encode your tags. Since they might come back as an array of strings, or a dictionary of arrays, we have tools to encode both into HTTP spec compliant query strings.

### .objectToQuery

`string Glimr.objectToQuery( object value )`

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

`string Glimr.arrayToQuery( array value, string key )`

Take an array and convert to a query string. The second argument is a string of which will become key for the values.

It will not modify keys like other frameworks might (i.e postfix them with `[]`), that is up to the implementer to make sure the keys are postfix'd.

```javascript
var tags = ["a", "bcd", "ef"];

var queryString = Glimr.arrayToQuery(tags, "my_key");

// my_key=a&my_key=bcd&my_key=ef
```

### .escapeStringForQuery

`string Glimr.escapeStringForQuery( string value )`

This is more of a helper that might be useful for very custom stuff. It's what `Glimr.objectToQuery` and `Glimr.arrayToQuery` use to encode the values.

Usage is easy:

```javascript
var escapedString = Glimr.escapeStringForQuery("hello world");

// hello%20world
```

## Google Tag Manager

Google Tag Manager is supported out of the box. All you need to do is create a custom HTML tag with the following snippet.

```html
<script src="https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.1/glimr.min.js"></script>
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

## Development

### Installation

```bash
git clone git@github.com:KatalysatorAB/GlimrSDK-JS.git
cd GlimrSDK-JS
npm install
```

### Testing

```bash
npm install -g testem
npm install -g phantomjs-prebuilt
node spec/server.js # keep alive in separate tab
testem
```

### Building for production

```bash
npm run build # will output to dist/glimr.min.js
```
