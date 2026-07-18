import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../extension/content.js'), 'utf8');

function run(html) {
  document.body.innerHTML = html;
  delete window.__svgDownloaderInjected;
  delete window.__svgDownloaderCollect;

  const messages = [];
  let listener = null;
  globalThis.chrome = {
    runtime: {
      onMessage: { addListener: (fn) => { listener = fn; } },
      sendMessage: (msg) => { messages.push(msg); },
      lastError: null,
    },
  };

  new Function(src)();
  return { messages, listener };
}

// The full list is no longer shipped on elementSelected — ask for it the way
// the popup does, via the getAllSVGs message.
function items({ listener }) {
  let svgs = [];
  listener({ action: 'getAllSVGs' }, {}, (res) => { svgs = res.svgs; });
  return svgs;
}

function count({ messages }) {
  const m = messages.find((x) => x.action === 'svgsCollected');
  return m ? m.data.count : 0;
}

function skipped({ messages }) {
  const m = messages.find((x) => x.action === 'svgsCollected');
  return m ? m.data.skipped : 0;
}

describe('collectSVGs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('collects an inline svg', () => {
    const its = items(run('<svg><circle></circle></svg>'));
    expect(its.filter((i) => i.type === 'svg').length).toBe(1);
  });

  it('collects an img with a query string (fails with the old selector)', () => {
    const its = items(run('<img src="/logo.svg?v=3">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects an img with a fragment', () => {
    const its = items(run('<img src="/logo.svg#a">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects a data-URI img', () => {
    const its = items(run('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('ignores a non-SVG img', () => {
    expect(count(run('<img src="/photo.png">'))).toBe(0);
  });

  it('collects an <object> SVG host', () => {
    const its = items(run('<object type="image/svg+xml" data="/a.svg"></object>'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('collects an <embed> SVG host', () => {
    const its = items(run('<embed type="image/svg+xml" src="/b.svg">'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('inlines a same-document <use> sprite so the geometry survives', () => {
    const its = items(
      run(
        '<svg style="display:none"><symbol id="i"><path d="M0 0"/></symbol></svg>' +
        '<svg><use href="#i"/></svg>'
      )
    );
    expect(its.some((i) => i.content.includes('M0 0'))).toBe(true);
  });

  it('skips an external sprite reference and counts it', () => {
    const result = run('<svg><use href="/sprite.svg#i"/></svg>');
    expect(count(result)).toBe(0);
    expect(skipped(result)).toBe(1);
  });

  it('deduplicates identical inline SVGs', () => {
    const its = items(run('<svg><circle></circle></svg><svg><circle></circle></svg>'));
    expect(its.length).toBe(1);
  });

  it('never mutates the page DOM when inlining sprites', () => {
    run(
      '<svg style="display:none"><symbol id="i"><path d="M0 0"/></symbol></svg>' +
      '<svg><use href="#i"/></svg>'
    );
    const symbol = document.querySelector('symbol');
    expect(symbol).not.toBeNull();
    expect(symbol.parentElement.tagName.toLowerCase()).toBe('svg');
  });

  it('collects a CSS background SVG from an inline style', () => {
    const its = items(run('<div style="background-image:url(/bg.svg)"></div>'));
    expect(its.filter((i) => i.type === 'img').length).toBe(1);
  });

  it('does not ship the full list on every navigation (elementSelected is slim)', () => {
    const { messages } = run('<svg><circle></circle></svg>');
    const m = messages.find((x) => x.action === 'elementSelected');
    expect(m).toBeDefined();
    expect(m.data.allSVGs).toBeUndefined();
    expect(m.data.currentIndex).toBe(0);
    expect(m.data.total).toBe(1);
  });
});
