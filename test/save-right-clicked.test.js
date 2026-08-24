import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadContent } from './helpers/content-harness.js';

// Drives the content script's context-menu handler end to end: a real
// contextmenu event marks the target, then a `saveRightClicked` message runs
// extraction → (external resolution) → sanitization through the real svg-utils
// module the harness resolves via chrome.runtime.getURL.

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function rightClick(el) {
  el.dispatchEvent(new window.MouseEvent('contextmenu', { bubbles: true }));
}

async function save(listener) {
  let response;
  listener({ action: 'saveRightClicked' }, {}, (res) => {
    response = res;
  });
  // The handler dynamically imports svg-utils and awaits a couple of promises.
  for (let i = 0; i < 5; i++) await flush();
  return response;
}

describe('content.js — saveRightClicked', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete globalThis.fetch;
  });
  afterEach(() => {
    delete globalThis.fetch;
  });

  it('saves a right-clicked inline <svg> as a sanitized standalone file', async () => {
    const handle = await loadContent({
      html: '<svg aria-label="cart icon"><path d="M1 2"/><script>alert(1)</script></svg>',
    });
    rightClick(document.querySelector('path'));

    const res = await save(handle.listener);
    expect(res.success).toBe(true);
    expect(res.content).toContain('M1 2');
    expect(res.content).not.toContain('<script'); // sanitized
    expect(res.content).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(res.filename).toBe('cart icon.svg'); // from aria-label
  });

  it('reports failure when the click was not on an SVG', async () => {
    const handle = await loadContent({ html: '<p id="t">hello</p>' });
    rightClick(document.getElementById('t'));

    const res = await save(handle.listener);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No SVG/);
  });

  it('fetches and saves a right-clicked <img> SVG, naming it from the file', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><circle r="3"/></svg>',
    }));
    const handle = await loadContent({
      html: '<img id="i" src="https://cdn.example/logo.svg">',
      fetch: fetchMock,
    });
    // jsdom leaves img.src absolute already; mark it as the target.
    rightClick(document.getElementById('i'));

    const res = await save(handle.listener);
    expect(res.success).toBe(true);
    expect(res.content).toContain('<circle');
    expect(res.filename).toBe('logo.svg');
  });

  it('names the file from a <title> when there is no aria-label', async () => {
    const handle = await loadContent({ html: '<svg><title>Bell</title><rect/></svg>' });
    rightClick(document.querySelector('rect'));
    const res = await save(handle.listener);
    expect(res.filename).toBe('Bell.svg');
  });

  it('names the file from the svg id as a last SVG-level resort', async () => {
    const handle = await loadContent({ html: '<svg id="hero-mark"><rect/></svg>' });
    rightClick(document.querySelector('rect'));
    const res = await save(handle.listener);
    expect(res.filename).toBe('hero-mark.svg');
  });

  it('falls back to a generic name when nothing describes the graphic', async () => {
    const handle = await loadContent({ html: '<svg><rect/></svg>' });
    rightClick(document.querySelector('rect'));
    const res = await save(handle.listener);
    expect(res.filename).toBe('svg.svg');
  });

  it('names an <img> SVG from its alt text before its filename', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
    }));
    const handle = await loadContent({
      html: '<img id="i" alt="Company logo" src="https://cdn.example/x.svg">',
      fetch: fetchMock,
    });
    rightClick(document.getElementById('i'));
    const res = await save(handle.listener);
    expect(res.filename).toBe('Company logo.svg');
  });

  it('saves an <object> SVG host', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><rect id="r"/></svg>',
    }));
    const handle = await loadContent({
      html: '<object id="o" type="image/svg+xml" data="https://cdn.example/d.svg"></object>',
      fetch: fetchMock,
    });
    rightClick(document.getElementById('o'));
    const res = await save(handle.listener);
    expect(res.success).toBe(true);
    expect(res.content).toContain('id="r"');
  });

  it('saves an SVG applied as a CSS background on an ancestor', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><rect id="bg"/></svg>',
    }));
    const handle = await loadContent({
      html: '<div style="background-image:url(https://cdn.example/bg.svg)"><span id="c">x</span></div>',
      fetch: fetchMock,
    });
    rightClick(document.getElementById('c'));
    const res = await save(handle.listener);
    expect(res.success).toBe(true);
    expect(res.content).toContain('id="bg"');
  });

  it('resolves an external sprite reference before saving', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () =>
        '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="i"><path d="M9 9"/></symbol></svg>',
    }));
    const handle = await loadContent({
      html: '<svg id="s"><use href="/sprite.svg#i"/></svg>',
      fetch: fetchMock,
    });
    rightClick(document.querySelector('#s use'));

    const res = await save(handle.listener);
    expect(res.success).toBe(true);
    expect(res.content).toContain('M9 9'); // sprite symbol inlined
    expect(fetchMock).toHaveBeenCalled();
  });
});
