import { beforeEach, describe, expect, it } from 'vitest';
import { bgScanSkipped, count, items, loadAndCollect, skipped } from './helpers/content-harness.js';

describe('collectSVGs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collects an inline svg', async () => {
    const its = items(await loadAndCollect('<svg><circle></circle></svg>'));
    expect(its.filter((i) => i.type === 'svg').length).toBe(1);
  });

  it('collects an img with a query string (fails with the old selector)', async () => {
    const its = items(await loadAndCollect('<img src="/logo.svg?v=3">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects an img with a fragment', async () => {
    const its = items(await loadAndCollect('<img src="/logo.svg#a">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects a data-URI img', async () => {
    const its = items(
      await loadAndCollect('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">')
    );
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('ignores a non-SVG img', async () => {
    expect(count(await loadAndCollect('<img src="/photo.png">'))).toBe(0);
  });

  it('collects an <object> SVG host', async () => {
    const its = items(await loadAndCollect('<object type="image/svg+xml" data="/a.svg"></object>'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects an <embed> SVG host', async () => {
    const its = items(await loadAndCollect('<embed type="image/svg+xml" src="/b.svg">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  // <object>/<embed> were pinned but <iframe> — the third host the collector
  // handles — was not, so dropping its branch broke nothing.
  it('collects an <iframe> SVG host and resolves it to an absolute URL', async () => {
    const its = items(await loadAndCollect('<iframe src="/diagram.svg"></iframe>'));
    expect(its.filter((i) => i.type === 'img').map((i) => i.content)).toEqual([
      'http://localhost/diagram.svg',
    ]);
  });

  // Unlike object/embed there is no type attribute to trust for iframes, so the
  // URL test is the only gate — an iframe of a normal page must not be offered
  // as a downloadable SVG.
  it('ignores an <iframe> that is not an SVG', async () => {
    expect(count(await loadAndCollect('<iframe src="/page.html"></iframe>'))).toBe(0);
  });

  it('inlines a same-document <use> sprite so the geometry survives', async () => {
    const its = items(
      await loadAndCollect(
        '<svg style="display:none"><symbol id="i"><path d="M0 0"/></symbol></svg>' +
          '<svg><use href="#i"/></svg>'
      )
    );
    expect(its.some((i) => i.content.includes('M0 0'))).toBe(true);
  });

  // Inline HTML <svg> is allowed to use xlink:href without declaring the
  // namespace. A standalone image/svg+xml file without it does not render, so
  // the popup preview and the downloaded file come out blank.
  it('declares xmlns:xlink when the markup uses it', async () => {
    const its = items(
      await loadAndCollect(
        '<svg style="display:none"><symbol id="i"><path d="M0 0"/></symbol></svg>' +
          '<svg><use xlink:href="#i"/></svg>'
      )
    );
    expect(its[0].content).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(its[0].content).toContain('M0 0');
  });

  it('skips an external sprite reference and counts it', async () => {
    const result = await loadAndCollect('<svg><use href="/sprite.svg#i"/></svg>');
    expect(count(result)).toBe(0);
    expect(skipped(result)).toBe(1);
  });

  it('deduplicates identical inline SVGs', async () => {
    const its = items(
      await loadAndCollect('<svg><circle></circle></svg><svg><circle></circle></svg>')
    );
    expect(its.length).toBe(1);
  });

  // dedupe runs across the merged list, not per collector. The same asset can
  // legitimately be reached by two different collectors on one page, and
  // offering it twice makes the ZIP contain a duplicate file.
  it('deduplicates one URL found by two different collectors', async () => {
    const result = await loadAndCollect(
      '<img src="/logo.svg"><div style="background-image:url(/logo.svg)"></div>'
    );
    expect(count(result)).toBe(1);
    expect(items(result).map((i) => i.content)).toEqual(['http://localhost/logo.svg']);
  });

  it('never mutates the page DOM when inlining sprites', async () => {
    await loadAndCollect(
      '<svg style="display:none"><symbol id="i"><path d="M0 0"/></symbol></svg>' +
        '<svg><use href="#i"/></svg>'
    );
    const symbol = document.querySelector('symbol');
    expect(symbol).not.toBeNull();
    expect(symbol.parentElement.tagName.toLowerCase()).toBe('svg');
  });

  it('collects a CSS background SVG from an inline style', async () => {
    const its = items(await loadAndCollect('<div style="background-image:url(/bg.svg)"></div>'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('does not ship the full list on every navigation (elementSelected is slim)', async () => {
    const { messages } = await loadAndCollect('<svg><circle></circle></svg>');
    const m = messages.find((x) => x.action === 'elementSelected');
    expect(m).toBeDefined();
    expect(m.data.allSVGs).toBeUndefined();
    expect(m.data.currentIndex).toBe(0);
    expect(m.data.total).toBe(1);
  });
});

// querySelectorAll stops at shadow boundaries. Any site built from web
// components — YouTube, Ionic, Salesforce Lightning — would otherwise report
// "0 found" against a page full of visible icons.
describe('collectSVGs — shadow DOM', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('finds an inline svg inside an open shadow root', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<svg><circle></circle></svg>';

    const result = await loadAndCollect();
    expect(items(result).filter((i) => i.type === 'svg').length).toBe(1);
  });

  it('finds an svg nested two shadow roots deep', async () => {
    document.body.innerHTML = '<div id="outer"></div>';
    const outer = document.getElementById('outer').attachShadow({ mode: 'open' });
    outer.innerHTML = '<div id="inner"></div>';
    const inner = outer.getElementById('inner').attachShadow({ mode: 'open' });
    inner.innerHTML = '<svg><rect></rect></svg>';

    expect(items(await loadAndCollect()).filter((i) => i.type === 'svg').length).toBe(1);
  });

  it('finds an img[src$=.svg] inside a shadow root', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<img src="/logo.svg">';

    expect(items(await loadAndCollect()).filter((i) => i.type === 'img').length).toBe(1);
  });

  it('cannot see into a closed shadow root, and does not crash trying', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'closed' });
    shadow.innerHTML = '<svg><circle></circle></svg>';

    await expect(loadAndCollect()).resolves.toBeDefined();
    expect(count(await loadAndCollect())).toBe(0);
  });

  // Id scoping is the whole point of shadow DOM, so cross-root collisions are
  // normal. resolveRef used to search the document first, which inlined an
  // unrelated component's artwork into the icon.
  it('resolves a <use> to its own shadow root, not a same-id node in the document', async () => {
    document.body.innerHTML =
      '<svg style="display:none"><symbol id="i"><path d="M-DOCUMENT"/></symbol></svg>' +
      '<div id="host"></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<svg style="display:none"><symbol id="i"><path d="M-SHADOW"/></symbol></svg>' +
      '<svg><use href="#i"/></svg>';

    const its = items(await loadAndCollect());
    expect(its).toHaveLength(1);
    expect(its[0].content).toContain('M-SHADOW');
    expect(its[0].content).not.toContain('M-DOCUMENT');
  });

  // No local #i at all: resolution has to fall outward to the document rather
  // than give up and emit an empty husk.
  it('falls back to the document when the shadow root has no matching id', async () => {
    document.body.innerHTML =
      '<svg style="display:none"><symbol id="i"><path d="M-DOCUMENT"/></symbol></svg>' +
      '<div id="host"></div>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<svg><use href="#i"/></svg>';

    const its = items(await loadAndCollect());
    expect(its[0].content).toContain('M-DOCUMENT');
  });

  // Last tier: the sprite sheet lives inside a component's shadow root while
  // the icon sits in the light DOM. document.getElementById cannot see it, so
  // without the shadow id index the icon exports as an empty husk.
  it('resolves a light-DOM <use> against a symbol inside a shadow root', async () => {
    document.body.innerHTML = '<div id="host"></div><svg><use href="#i"/></svg>';
    const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<svg style="display:none"><symbol id="i"><path d="M-SPRITE"/></symbol></svg>';

    const its = items(await loadAndCollect());
    expect(its).toHaveLength(1);
    expect(its[0].content).toContain('M-SPRITE');
  });
});

// Every inline SVG is serialized and the whole list crosses the runtime message
// boundary in one response. Without these caps a pathological page hangs or
// OOMs the popup; without the counter it silently under-reports instead.
describe('collectSVGs — corpus caps', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('stops at MAX_INLINE_SVGS (2000) and counts the overflow as skipped', async () => {
    const result = await loadAndCollect('<svg><circle></circle></svg>'.repeat(2001));
    // The cap is applied before dedupe, so exactly one SVG falls off the end.
    expect(skipped(result)).toBe(1);
  });

  it('collects the full corpus when it sits just under the cap', async () => {
    const result = await loadAndCollect('<svg><circle></circle></svg>'.repeat(2000));
    expect(skipped(result)).toBe(0);
  });

  it('skips a single SVG larger than MAX_SVG_BYTES and counts it', async () => {
    const huge = 'M0 0 '.repeat(420_000); // ~2.1MB of path data
    const result = await loadAndCollect(`<svg><path d="${huge}"/></svg>`);
    expect(count(result)).toBe(0);
    expect(skipped(result)).toBe(1);
  });
});

// getComputedStyle over every element on the page is O(n) with a real constant.
// A popup that hangs is worse than one that misses a background icon, but the
// popup has to be told the scan was partial rather than shown a confident zero.
describe('collectBackgroundSVGs — element-count bail-out', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('bails past 10000 elements and flags bgScanSkipped', async () => {
    const result = await loadAndCollect(
      `<div style="background-image:url(/bg.svg)"></div>${'<div></div>'.repeat(10_001)}`
    );
    expect(bgScanSkipped(result)).toBe(true);
    // It really bailed: the background that a normal scan finds is absent.
    expect(count(result)).toBe(0);
  });

  it('does not flag bgScanSkipped on an ordinary page', async () => {
    const result = await loadAndCollect('<div style="background-image:url(/bg.svg)"></div>');
    expect(bgScanSkipped(result)).toBe(false);
    expect(count(result)).toBe(1);
  });
});
