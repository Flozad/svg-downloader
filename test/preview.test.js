import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderPreview } from '../extension/preview.js';

describe('renderPreview', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('renders an inline SVG as an <img>, never as live markup', () => {
    const el = document.createElement('div');
    renderPreview(el, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

    expect(el.childNodes.length).toBe(1);
    expect(el.firstChild.tagName).toBe('IMG');
    expect(el.querySelector('script')).toBeNull();
  });

  // The popup must never point its <img> at a page-controlled URL: that would
  // make the extension origin issue an attacker-attributable request on every
  // popup open. Remote SVGs are fetched to markup by the caller instead, so
  // whatever arrives here is always blob-backed.
  it('always renders through a blob, never a passed-in URL', () => {
    const el = document.createElement('div');
    renderPreview(el, 'https://attacker.example/beacon.svg?u=VICTIM');

    expect(el.firstChild.getAttribute('src')).toBe('blob:fake');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('does not allow attribute injection through the markup it is given', () => {
    const el = document.createElement('div');
    renderPreview(el, '<svg/>" onerror="alert(1)');

    expect(el.firstChild.tagName).toBe('IMG');
    expect(el.firstChild.getAttribute('onerror')).toBeNull();
  });

  it('revokes the previous object URL on the next render', () => {
    const el = document.createElement('div');
    const first = renderPreview(el, '<svg/>');
    renderPreview(el, '<svg/>', first);

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first);
  });
});
