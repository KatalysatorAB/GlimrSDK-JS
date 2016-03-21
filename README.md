# GlimrSDK-JS

JavaScript SDK for glimr.io.

The current version can be accessed from here:

- https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.0/glimr.min.js
- https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.0/glimr.js

## Usage

### .getTags

Fetch all tags associated with the current browser client.

```js
Glimr.getTags("YOUR_CLIENT_ID", function(tags) {
  console.log("Tags for client:", tags);
});
```

_Note:_ The `getTags`-call is cached for the duration of the page load. So calling it multiple times will only result in one call to the Glimr servers. The cache is cleared on page refresh.

### .setTagCacheTimeInSeconds

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

Glimr crawls your web property and knows which URL indicates a set of tags, based on filters you setup in the dashboard. The Glimr SDK can download and cache this database in an efficiant manner, and you can use it to get tags without having to make a network request. To fetch the tags associated with the current browser URL you call `Glimr.getCachedURLTags` which does a fast synchronous lookup.

```js
var tags = Glimr.getCachedURLTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

**Note:** This method used to be called `.getCachedTags`. For backwards compatibility it will exist until the next major release.

### .getTagsAndPushToDataLayer

Does the same calls as `Glimr.getTags`, but instead of a callback it simply pushes the tags to the global variable named `dataLayer`, which Google Tag Manager uses.

```js
var tags = Glimr.getCachedURLTags("YOUR_CLIENT_ID");
console.log("Cached tags", tags);
```

## Google Tag Manager

Google Tag Manager is supported out of the box. All you need to do is create a custom HTML tag with the following snippet.

```html
<script src="https://storage.googleapis.com/glimr-static/glimrsdk-js/1.3.0/glimr.min.js"></script>
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
