import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderPreview } from '../extension/preview.js';

describe('renderPreview', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('renders an inline SVG as an <img>, never as live markup', () => {
    const el = document.createElement('div');
    renderPreview(el, {
      type: 'svg',
      content: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    });

    expect(el.childNodes.length).toBe(1);
    expect(el.firstChild.tagName).toBe('IMG');
    expect(el.querySelector('script')).toBeNull();
  });

  it('does not allow attribute injection through the img url branch', () => {
    const el = document.createElement('div');
    const injected = 'https://x/y.svg" onerror="alert(1)';
    renderPreview(el, { type: 'img', content: injected });

    expect(el.firstChild.tagName).toBe('IMG');
    expect(el.firstChild.getAttribute('onerror')).toBeNull();
    expect(el.firstChild.getAttribute('src')).toBe(injected);
  });

  it('revokes the previous object URL on the next render', () => {
    const el = document.createElement('div');
    const first = renderPreview(el, { type: 'svg', content: '<svg/>' });
    renderPreview(el, { type: 'svg', content: '<svg/>' }, first);

    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(first);
  });
});
