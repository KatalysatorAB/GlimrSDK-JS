# GlimrSDK-JS

JavaScript SDK for glimr.io.

The current version can be access from here:

https://storage.googleapis.com/glimr-static/glimrsdk-js/1.0.2/glimr.min.js
https://storage.googleapis.com/glimr-static/glimrsdk-js/1.0.2/glimr.js

## Usage

### .getTags

Fetch all tags associated with the current browser client.

```js
Glimr.getTags("YOUR_CLIENT_ID", function(tags) {
  console.log("Tags for client:", tags);
});
```

_Note:_ The `getTags`-call is cached for the duration of the page load. So calling it multiple times will only result in one call to the Glimr servers. The cache is cleared on page refresh.

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
