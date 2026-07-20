// Every other suite asserts on *strings*. This one asserts on *pixels*.
//
// The failure the string tests structurally cannot catch is the one users
// actually report: the file downloads fine, then opens blank or errors in a
// viewer. So here we push markup through the real export pipeline
// (formatSVGContent, exactly what downloadSVG writes to disk) and then hand the
// bytes to a genuine SVG rasterizer. If librsvg can't render it, neither can
// the user's browser, Figma, or Illustrator.
//
// Fixtures under test/fixtures/ are real markup captured from live pages via
// the extension's own collector, not markup written to match the implementation.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { formatSVGContent } from '../extension/svg-utils.js';

const FIXTURE_DIR = join(import.meta.dirname, 'fixtures');

// Rasterize and report what actually landed on the canvas. Returns the share of
// pixels that are not fully transparent — 0 means the file "opened blank".
async function rasterize(markup) {
  const png = await sharp(Buffer.from(markup), { density: 96 })
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = png;
  let visible = 0;
  const total = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    const alpha = info.channels === 4 ? data[i + 3] : 255;
    if (alpha > 8) visible++;
  }
  return visible / total;
}

function loadFixtures() {
  return readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(FIXTURE_DIR, f), 'utf8'))]);
}

// A corpus test that only ever passes is indistinguishable from a corpus test
// that is broken. These are known-bad files: if the rasterizer stops flagging
// them, the checks above have gone vacuous and this suite is lying.
describe('harness self-check: known-broken files are detected', () => {
  const BLANK_CASES = {
    'husk holding only <defs>':
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><defs><filter id="d"><feTurbulence/></filter></defs></svg>',
    '<use> pointing at a symbol left behind on the page':
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><use href="#nope"/></svg>',
    'shape whose fill never resolved':
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="none"/></svg>',
  };

  for (const [label, markup] of Object.entries(BLANK_CASES)) {
    it(`flags as blank: ${label}`, async () => {
      expect(await rasterize(await formatSVGContent(markup))).toBe(0);
    });
  }

  it('rejects malformed markup before it reaches disk', async () => {
    await expect(
      formatSVGContent('<svg xmlns="http://www.w3.org/2000/svg"><path d="M2 2h20"')
    ).rejects.toThrow('Invalid SVG markup');
  });

  it('still passes a genuinely good file', async () => {
    const good =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="red"/></svg>';
    expect(await rasterize(await formatSVGContent(good))).toBeGreaterThan(0.5);
  });
});

describe('extracted SVGs open and paint', () => {
  for (const [site, items] of loadFixtures()) {
    // Remote items are URLs, not markup — they are fetched at download time and
    // there is nothing to rasterize here.
    const inline = items.filter((item) => item.type === 'svg');

    // Pin the corpus size, not just non-emptiness: a fixture that silently
    // shrinks to a single item would still satisfy `> 0` while quietly
    // dropping most of the coverage this suite exists to provide.
    it(`${site}: captured a non-trivial corpus`, () => {
      expect(inline.length).toBeGreaterThanOrEqual(10);
    });

    describe(site, () => {
      inline.forEach((item, index) => {
        it(`svg #${index + 1} rasterizes to visible pixels`, async () => {
          const exported = await formatSVGContent(item.content);

          // Step 1: does a real rasterizer accept the file at all? A throw here
          // is the "won't open" bug.
          let coverage;
          try {
            coverage = await rasterize(exported);
          } catch (error) {
            throw new Error(
              `Rasterizer rejected the exported file: ${error.message}\n${exported.slice(0, 300)}`
            );
          }

          // Step 2: did it paint anything? A file that parses but renders empty
          // is just as broken from the user's side.
          expect(
            coverage,
            `exported file rendered blank (0 visible pixels):\n${exported.slice(0, 300)}`
          ).toBeGreaterThan(0);

          // Step 3: is it intrinsically sizeable? The capture probe classifies
          // "no viewBox and no width/height" as its own zeroSize verdict — such
          // a file rasterizes fine at a forced size here, but collapses to
          // nothing in a browser tab or an <img> with no dimensions of its own.
          const root = exported.slice(
            exported.indexOf('<svg'),
            exported.indexOf('>', exported.indexOf('<svg')) + 1
          );
          const sizeable =
            /\bviewBox\s*=/.test(root) || (/\bwidth\s*=/.test(root) && /\bheight\s*=/.test(root));
          expect(sizeable, `exported file has neither viewBox nor width+height:\n${root}`).toBe(
            true
          );
        });
      });
    });
  }
});
