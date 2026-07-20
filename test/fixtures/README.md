# Real-page fixtures

Each `*.json` here is the **actual output of `extension/content.js`** running on a
real page — the collector's own return value, captured verbatim. They are not
hand-written, which is the point: markup written by the same person who wrote the
implementation tends to agree with it.

`renders.test.js` pushes every inline item through `formatSVGContent` (the real
export path) and rasterizes the result with `sharp`. A fixture fails if the
exported file won't parse or paints zero pixels — the "downloads but opens blank"
bug that string assertions can't see.

## Capturing a new fixture

When a page misbehaves, freeze it:

```bash
node scripts/fixture-capture/serve.mjs        # serves content.js + probe.js with CORS
```

It prints a per-run capture token. `/capture` rejects anything without it — the
POST below skips the CORS preflight by design, so without a token any page you
happen to have open could plant a fixture.

Then in that page's devtools console:

```js
(0, eval)(await fetch('http://localhost:8931/probe.js').then((r) => r.text()));
await window.__runProbe();                     // prints a verdict summary
```

To save it as a fixture, re-run the collector and POST the items:

```js
const src = await fetch('http://localhost:8931/content.js').then((r) => r.text());
let listener = null;
window.chrome = {
  runtime: {
    lastError: undefined,
    sendMessage: () => {},
    onMessage: { addListener: (f) => { listener = f; } },
  },
};
delete window.__svgDownloaderInjected;
(0, eval)(src);
// Evaluating content.js only registers the listener; the popup is what drives
// the scan, so send collectSVGs before asking for the results.
listener({ action: 'collectSVGs' }, null, () => {});
let items = [];
listener({ action: 'getAllSVGs' }, null, (r) => { items = r.svgs || []; });
await fetch('http://localhost:8931/capture/PASTE-TOKEN-HERE', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },   // text/plain dodges the CORS preflight
  body: JSON.stringify({ name: 'the-site', items }),
}).then((r) => r.text());
```

### Two sites where this won't work

- **Trusted Types pages** (YouTube, some Google properties) block `eval` outright.
- **Strict `connect-src` pages** (GitHub) block the `localhost` fetch.

Both are limits of *this console-driven harness*, not of the extension — which
injects via `chrome.scripting.executeScript` and is unaffected by either. To
capture from such a page, paste `extension/content.js` inline instead of
fetching it, and read the items out of the returned object rather than POSTing.
