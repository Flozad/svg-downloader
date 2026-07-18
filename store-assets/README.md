# Chrome Web Store assets — SVG Downloader & Extractor

Every marketing asset for the store listing, rendered from the Remotion project
in [`../motion`](../motion). All monochrome, matching the extension's black-and-white
popup. To regenerate any of these, see "Rebuilding" at the bottom.

## Files & where each one goes

| File | Pixels | Where it goes in the Developer Dashboard |
|------|--------|------------------------------------------|
| `01-find-every-svg.png` | 1280 × 800 | **Store listing → Screenshots** (slot 1) |
| `02-preview-each.png` | 1280 × 800 | **Store listing → Screenshots** (slot 2) |
| `03-page-through.png` | 1280 × 800 | **Store listing → Screenshots** (slot 3) |
| `04-download-current.png` | 1280 × 800 | **Store listing → Screenshots** (slot 4) |
| `05-download-all-zip.png` | 1280 × 800 | **Store listing → Screenshots** (slot 5) |
| `06-brand.png` | 1280 × 800 | **Store listing → Screenshots** (optional 6th / spare) |
| `promo-tile-440x280.png` | 440 × 280 | **Store listing → Small promo tile** |
| `marquee-tile-1400x560.png` | 1400 × 560 | **Store listing → Marquee promo tile** |
| `promo.mp4` | 1280 × 800, ~24 s, H.264 | **Store listing → Promotional video** (upload to YouTube, then paste the URL) |

### Notes on the store's requirements

- **Screenshots** must be **1280 × 800** or 640 × 400. 1280 × 800 is the preferred
  size and is what these are. At least one screenshot is required; up to five are
  shown. Files `01`–`05` are the intended set; `06-brand.png` is a spare.
- **Small promo tile** must be **exactly 440 × 280** — required to be featured.
- **Marquee promo tile** must be **exactly 1400 × 560** — only used if the Chrome
  Web Store editorial team features the extension, but good to have ready.
- **Promotional video** is a **YouTube URL**, not a file upload. Upload
  `promo.mp4` to YouTube (unlisted is fine) and paste the link into the listing.
- **Store icon** must be **128 × 128 PNG**. This is NOT in this folder — it ships
  inside the extension itself at [`../extension/icons/icon.png`](../extension/icons/icon.png)
  and is declared in `manifest.json` (`"icons": { "128": "icons/icon.png" }`).
  If the store requires a separate upload, export a 128 × 128 PNG from
  `../extension/icons/icon.svg`.

## What each screenshot shows

1. **Find every SVG on any page** — the popup open beside an icon-library site,
   "24 SVGs found", the first SVG previewed.
2. **Preview each icon, logo & vector** — the isolated preview well.
3. **Page through them one by one** — Previous / Next navigation.
4. **Download the original SVG in one click** — the black primary button and the
   "Saved …" confirmation.
5. **Or grab them all as a ZIP** — the outlined "Download All as ZIP" button and
   the "24 SVGs saved" confirmation.

The promo video (`promo.mp4`) walks the whole flow: browsing an icon-packed page →
opening the extension → the counter scanning up to 24 → paging the previews →
downloading one, then all as a ZIP → the closing brand card with the tagline
**"Extract & download any SVG from any website."**

## Rebuilding

From [`../motion`](../motion):

```bash
bun install
bun run render          # renders every asset in this folder
# or a subset:
bun run render promo                # just the video
bun run render shot-01 shot-04      # specific screenshots
bun run studio                      # open Remotion Studio to preview/tweak
```

The first render downloads a headless Chromium shell (~85 MB) once. Output
filenames are mapped from composition ids in `../motion/scripts/render-all.ts`.
