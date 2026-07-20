import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { items, loadAndCollect } from './helpers/content-harness.js';

// jsdom does not implement the SVG presentation properties (`fill`/`stroke` come
// back empty from its getComputedStyle), so there is no way to observe the real
// cascade here. Stub getComputedStyle instead of writing a test that passes for
// the wrong reason: the stub stands in for the browser's resolved value, and the
// assertions are about what content.js does with it.
function stubComputedStyle(style) {
  const seen = [];
  vi.spyOn(globalThis, 'getComputedStyle').mockImplementation((el) => {
    seen.push(el);
    return { backgroundImage: 'none', fill: '', stroke: '', ...style };
  });
  return seen;
}

describe('resolveColors', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A standalone file has no inherited `color`, so currentColor falls back to
  // the initial value and figma-style icons export blank.
  it('bakes currentColor into the extracted clone', async () => {
    stubComputedStyle({ fill: 'rgb(255, 0, 0)' });
    const its = items(await loadAndCollect('<svg><path fill="currentColor" d="M0 0"/></svg>'));

    expect(its[0].content).toContain('fill="rgb(255, 0, 0)"');
    expect(its[0].content).not.toContain('currentColor');
  });

  // Same failure mode: a var(--token) reference resolves against nothing once
  // the markup leaves the page.
  it('bakes a var(--x) reference into the extracted clone', async () => {
    stubComputedStyle({ stroke: 'rgb(0, 128, 0)' });
    const its = items(
      await loadAndCollect('<svg><path stroke="var(--brand)" fill="none" d="M0 0"/></svg>')
    );

    expect(its[0].content).toContain('stroke="rgb(0, 128, 0)"');
    expect(its[0].content).not.toContain('var(--brand)');
  });

  it('leaves literal colors alone', async () => {
    stubComputedStyle({ fill: 'rgb(255, 0, 0)' });
    const its = items(await loadAndCollect('<svg><path fill="#0000ff" d="M0 0"/></svg>'));

    expect(its[0].content).toContain('fill="#0000ff"');
  });

  // Overwriting with `none` would paint out artwork that the page shows, so an
  // unresolvable value has to be left as-is rather than baked.
  it('does not bake a computed value of none', async () => {
    stubComputedStyle({ fill: 'none' });
    const its = items(await loadAndCollect('<svg><path fill="currentColor" d="M0 0"/></svg>'));

    expect(its[0].content).toContain('fill="currentColor"');
  });

  // The resolved value must come from the on-page element. Reading the detached
  // clone returns the initial value for everything and silently does nothing.
  it('reads the computed style off live nodes, never the clone', async () => {
    const seen = stubComputedStyle({ fill: 'rgb(255, 0, 0)' });
    await loadAndCollect('<svg><path fill="currentColor" d="M0 0"/></svg>');

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((el) => el.isConnected)).toBe(true);
  });

  it('never mutates the live page DOM', async () => {
    stubComputedStyle({ fill: 'rgb(255, 0, 0)' });
    await loadAndCollect('<svg><path fill="currentColor" d="M0 0"/></svg>');

    expect(document.querySelector('path').getAttribute('fill')).toBe('currentColor');
  });

  // resolveColors walks the live tree and the clone by index, so it must run
  // before <use> inlining adds a <defs> to the clone. Run it after and the
  // length check bails, leaving every color unresolved — exactly the sprite
  // icons that need it most.
  it('runs before <use> inlining, on both the host and the inlined symbol', async () => {
    stubComputedStyle({ fill: 'rgb(1, 2, 3)', stroke: 'rgb(4, 5, 6)' });
    const its = items(
      await loadAndCollect(
        '<svg style="display:none"><symbol id="i"><path d="M0 0" stroke="currentColor"/></symbol></svg>' +
          '<svg fill="currentColor"><use href="#i"/></svg>'
      )
    );

    expect(its).toHaveLength(1);
    expect(its[0].content).toContain('fill="rgb(1, 2, 3)"');
    expect(its[0].content).toContain('stroke="rgb(4, 5, 6)"');
    expect(its[0].content).not.toContain('currentColor');
  });
});
