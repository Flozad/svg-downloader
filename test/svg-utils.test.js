import { describe, expect, it } from 'vitest';
import { formatSVGContent, sanitizeFilename } from '../extension/svg-utils.js';

describe('formatSVGContent', () => {
  it('prepends an XML declaration when absent', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
    );
    expect(out).toContain('<path');
    expect(out.startsWith('<?xml')).toBe(true);
  });

  it('wraps bare markup that has no <svg> root', async () => {
    const out = await formatSVGContent('<path d="M0 0"/>');
    expect(out).toContain('<svg');
    expect(out).toContain('<path');
    expect(out).not.toContain('parsererror');
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('adds the SVG namespace when the source markup omits it', async () => {
    const out = await formatSVGContent('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('preserves an existing xmlns without duplicating it', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect/></svg>'
    );
    const matches = out.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(1);
  });

  it('declares xmlns:xlink when an xlink: prefix is used', async () => {
    const out = await formatSVGContent(
      '<svg viewBox="0 0 1 1"><use xlink:href="#a"/></svg>'
    );
    expect(out).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it('throws on malformed markup', async () => {
    await expect(formatSVGContent('<svg><path d="M0 0"></svg>')).rejects.toThrow(
      'Invalid SVG markup'
    );
  });

  it('never returns a parsererror document for malformed markup', async () => {
    let returned = null;
    try {
      returned = await formatSVGContent('<svg><path d="M0 0"></svg>');
    } catch {
      // expected
    }
    expect(returned).toBeNull();
  });

  it('starts with the XML declaration exactly once even when the input carried one', async () => {
    const out = await formatSVGContent(
      '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>'
    );
    const decls = out.match(/<\?xml/g);
    expect(decls.length).toBe(1);
    expect(out.startsWith('<?xml')).toBe(true);
  });
});

describe('sanitizeFilename', () => {
  it('keeps a simple name and appends .svg', () => {
    expect(sanitizeFilename('logo', 'svg-1')).toBe('logo.svg');
  });

  it('does not double the extension when the user typed .svg', () => {
    expect(sanitizeFilename('logo.svg', 'svg-1')).toBe('logo.svg');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeFilename('  logo  ', 'svg-1')).toBe('logo.svg');
  });

  it('falls back on an empty name', () => {
    expect(sanitizeFilename('', 'svg-1')).toBe('svg-1.svg');
  });

  it('falls back on a whitespace-only name', () => {
    expect(sanitizeFilename('   ', 'svg-1')).toBe('svg-1.svg');
  });

  it('strips path traversal', () => {
    const out = sanitizeFilename('../../etc/passwd', 'svg-1');
    expect(out).not.toContain('/');
    expect(out).not.toContain('..');
  });

  it('strips separators', () => {
    const out = sanitizeFilename('a/b\\c', 'svg-1');
    expect(out).not.toContain('/');
    expect(out).not.toContain('\\');
  });

  it('falls back on a Windows reserved name', () => {
    expect(sanitizeFilename('con', 'svg-1')).toBe('svg-1.svg');
  });

  it('caps the length', () => {
    const out = sanitizeFilename('x'.repeat(300), 'svg-1');
    expect(out.length).toBeLessThanOrEqual(104);
  });

  it('falls back on a bare dot-dot', () => {
    expect(sanitizeFilename('..', 'svg-1')).toBe('svg-1.svg');
  });
});
