# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through [GitHub Security Advisories](https://github.com/Flozad/svg-downloader/security/advisories/new), which lets us discuss and fix the issue before it becomes public.

Please include what you can: affected file or feature, reproduction steps (a minimal HTML page that triggers it is ideal), the Chrome and extension versions, and the impact you think it has.

Expect an initial response within a week. Once a fix ships to the Chrome Web Store, we'll publish the advisory and credit you unless you'd rather stay anonymous.

## Supported versions

Only the latest released version receives security fixes.

## Threat model

This extension reads SVG content from **arbitrary untrusted web pages**. SVG is an active content format — it can carry `<script>`, `on*` event handlers, `javascript:` URLs, and `<foreignObject>` HTML. Reports that turn on this fact are especially welcome.

The design rests on a few deliberate decisions. If you find a way around any of them, that is a genuine vulnerability:

- **Untrusted SVG never becomes live markup in an extension page.** Previews render via `<img src="blob:…">` (`extension/preview.js`), which the browser renders in a restricted mode: no script execution, no external resource loads. There is no `innerHTML` anywhere in the extension.
- **The popup never loads a page-controlled URL.** Remote SVGs are fetched to markup through the content script first, so the `chrome-extension://` origin issues no attacker-attributable requests. `img-src` is limited to `'self' blob: data:`.
- **Network requests happen at page origin.** `fetchSVG` runs in the content script under `activeTab` and CORS, with a scheme allowlist (`http:`/`https:`/`data:`), so it cannot reach anything the page could not already reach itself. `file:` and `chrome-extension:` are rejected.
- **Filenames are sanitized before reaching `chrome.downloads`.** See `sanitizeFilename` / `sanitizeNamePart` in `extension/svg-utils.js`; path separators are stripped before dot runs collapse, so traversal cannot reassemble.
- **Permissions are minimal.** `activeTab` and `scripting` with no host permissions, so page access requires an explicit user gesture and expires on navigation.
- **No remote code.** No background service worker, no `externally_connectable`, and the only vendored dependency is JSZip, pinned and byte-identical to upstream.

### Known and accepted

Downloaded `.svg` files are saved **byte-for-byte as the page served them**, including any embedded `<script>`. This is intentional — silently rewriting a designer's file would be its own bug — and such a file is inert in the popup and in any `<img>`. It only executes if the user opens it directly as a top-level document, where a `file://` origin heavily sandboxes it. Please don't report this as a vulnerability; if you'd like an opt-in sanitizing toggle, open a feature request.
