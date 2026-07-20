import { describe, expect, it } from 'vitest';
import { formatSVGContent, sanitizeFilename, sanitizeNamePart } from '../extension/svg-utils.js';

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
    const out = await formatSVGContent('<svg viewBox="0 0 1 1"><use xlink:href="#a"/></svg>');
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

  // Windows reserves the device names with any extension, not just bare.
  it('falls back on a reserved name carrying an extension', () => {
    expect(sanitizeFilename('con.txt', 'svg-1')).toBe('svg-1.svg');
    expect(sanitizeFilename('LPT1.backup', 'svg-1')).toBe('svg-1.svg');
  });

  it('caps the length', () => {
    const out = sanitizeFilename('x'.repeat(300), 'svg-1');
    expect(out.length).toBeLessThanOrEqual(104);
  });

  it('falls back on a bare dot-dot', () => {
    expect(sanitizeFilename('..', 'svg-1')).toBe('svg-1.svg');
  });
});

// filenamePrefix / zipName reach chrome.downloads and ZIP entry names without
// passing through sanitizeFilename, so the bare-name cleaner is the boundary
// that has to hold for them.
describe('sanitizeNamePart', () => {
  it('returns a bare name with no extension appended', () => {
    expect(sanitizeNamePart('my-icons')).toBe('my-icons');
  });

  it('defuses traversal so it cannot become a zip-slip entry name', () => {
    const out = sanitizeNamePart('../../../.bashrc');
    expect(out).not.toContain('/');
    expect(out).not.toContain('..');
  });

  it('strips separators from an absolute path', () => {
    const out = sanitizeNamePart('C:\\Windows\\System32');
    expect(out).not.toContain('\\');
    expect(out).not.toContain(':');
  });

  it('returns empty when nothing usable survives, so callers fall back', () => {
    expect(sanitizeNamePart('')).toBe('');
    expect(sanitizeNamePart('...')).toBe('');
    expect(sanitizeNamePart('con')).toBe('');
  });

  it('preserves spaces and accents', () => {
    expect(sanitizeNamePart('mis íconos')).toBe('mis íconos');
  });
});

describe('sanitizeNamePart truncation', () => {
  it('never emits a lone surrogate when truncating at the cap', () => {
    // 99 BMP chars then an emoji: a UTF-16 slice(0,100) would cut the pair.
    const out = sanitizeNamePart('a'.repeat(99) + '\u{1F600}');
    expect(
      [...out].every((ch) => {
        const c = ch.codePointAt(0);
        return c < 0xd800 || c > 0xdfff;
      })
    ).toBe(true);
  });

  it('caps at 100 code points', () => {
    expect([...sanitizeNamePart('x'.repeat(250))].length).toBe(100);
  });

  it('does not leave a trailing dot that would form `..` with the extension', () => {
    // Truncation used to run after the trim, reintroducing a trailing dot that
    // chrome.downloads rejects outright once `.svg` is appended.
    const name = sanitizeFilename('a'.repeat(99) + '..bb', 'fallback');
    expect(name).not.toContain('..');
    expect(name.endsWith('.svg')).toBe(true);
  });
});
