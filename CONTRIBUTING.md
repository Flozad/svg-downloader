# Contributing

Thanks for taking the time. Issues and pull requests are both welcome.

## Prerequisites

[Bun](https://bun.sh) and Chrome (or any Chromium browser). That's it for the extension itself — there is no build step, the source in `extension/` is what ships.

```bash
git clone https://github.com/Flozad/svg-downloader.git
cd svg-downloader
bun install
```

## Loading the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. **Load unpacked** → select the `extension/` folder

After editing, hit the reload icon on the extension card. Reloading also requires reloading any already-open tab you want to test against, since the content script is injected on demand.

## Everyday commands

```bash
bun run test        # vitest, one pass
bun run test:watch  # vitest, watch mode
bun run lint        # biome check
bun run format      # biome, writing fixes
bun run package     # build dist/svg-downloader-extractor-v<version>.zip
```

CI runs `lint`, `test`, and `package` on every pull request.

Some tests deliberately exercise error paths, so a passing run still prints stack traces to stderr. Trust the summary line, not the noise.

## Project layout

| Path | What it is |
| --- | --- |
| `extension/` | **The extension.** Plain ESM, no bundler. This is the part most PRs touch. |
| `test/` | Vitest suite (jsdom), covering collection, preview, filenames, and popup flows. |
| `scripts/package.sh` | Builds the Chrome Web Store zip from `extension/`. |
| `docs/` | The marketing site at [svg.clasicwebtools.com](https://svg.clasicwebtools.com). Static HTML/CSS. |
| `motion/` | **Optional.** A separate [Remotion](https://remotion.dev) project that renders the promo videos and screenshots. Has its own `package.json` and lockfile. |
| `store-assets/` | Rendered screenshots and promo art for the Web Store listing. |

`motion/` is intentionally not part of the root install — it pulls Remotion plus a headless Chromium shell (~85MB), which nobody needs just to run the unit tests. If you do want it: `cd motion && bun install`.

## Working on the extension

A few things worth knowing before you change `extension/`:

**SVG from a web page is untrusted input.** It can contain `<script>`, event handlers, and `javascript:` URLs. The load-bearing rule is that untrusted SVG never becomes live markup in an extension page — previews go through `<img src="blob:…">`, and there is no `innerHTML` in the codebase. Please keep it that way; the comments in `extension/preview.js` explain why. See [SECURITY.md](SECURITY.md) for the full threat model.

**The popup runs with extension privileges; the content script does not.** Network requests belong in the content script (`fetchSVG`), where they run at page origin under `activeTab`. Moving one into the popup silently escalates it.

**Adding a permission is a big deal.** The manifest currently has no host permissions, which is a large part of why the extension passes review easily. If a change seems to need `<all_urls>`, open an issue first.

## Pull requests

- Add or update tests for behavior you change — `test/` mirrors `extension/` file by file.
- Run `bun run lint` and `bun run test` before pushing.
- Keep the diff focused; unrelated reformatting makes review harder.
- Describe what you changed and how you verified it. Screenshots help for UI changes.

Not every idea needs an issue first, but for anything large or architectural, open one — it's cheaper than finding out after you've written it.
