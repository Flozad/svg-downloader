import { describe, expect, it } from 'vitest';
import { LOCALES, localePath } from '../scripts/i18n/config.mjs';
import { injectIntoSource, localizeHref, pageId, stripInjected } from '../scripts/i18n/page.mjs';
import { collectSegments, keyOf } from '../scripts/i18n/segments.mjs';

const parse = (body) =>
  new DOMParser().parseFromString(
    `<!doctype html><html><head><title>T</title></head><body>${body}</body></html>`,
    'text/html'
  );

const es = LOCALES.find((l) => l.code === 'es');
const en = LOCALES.find((l) => l.default);

describe('segment extraction', () => {
  it('keeps a sentence and its inline markup as one segment', () => {
    const doc = parse('<section><p>Save the <code>&lt;svg&gt;</code> <em>now</em>.</p></section>');
    const segments = collectSegments(doc).filter((s) => s.type === 'html');
    expect(segments.map((s) => s.source)).toEqual([
      'Save the <code>&lt;svg&gt;</code> <em>now</em>.',
    ]);
  });

  it('splits a wrapper whose children are all elements', () => {
    const doc = parse(
      '<nav class="nav"><span class="nav-links"><a href="/a">Features</a><a href="/b">Guides</a></span></nav>'
    );
    const segments = collectSegments(doc).filter((s) => s.type === 'html');
    expect(segments.map((s) => s.source)).toEqual(['Features', 'Guides']);
  });

  it('replaces an inline icon with a placeholder and puts it back', () => {
    const doc = parse(
      '<div><a class="btn"><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>Get the extension</a></div>'
    );
    const [segment] = collectSegments(doc).filter((s) => s.type === 'html');
    expect(segment.source).toBe('{{0}}Get the extension');
    segment.apply('{{0}}Instalar la extensión');
    expect(doc.querySelector('a').innerHTML).toBe(
      '<svg viewBox="0 0 1 1"><path d="M0 0"></path></svg>Instalar la extensión'
    );
  });

  it('never translates a script, a style or the guts of an icon', () => {
    const doc = parse(
      '<div><script>var a = "Hello";</script><style>.a{}</style><svg><title>Icon</title></svg></div>'
    );
    expect(collectSegments(doc).filter((s) => s.type === 'html')).toHaveLength(0);
  });

  it('collects prose held in attributes', () => {
    const doc = parse(
      '<div><img src="/a.png" alt="A saved icon"><button aria-label="Close">×</button></div>'
    );
    const attrs = collectSegments(doc).filter((s) => s.type === 'attr');
    expect(attrs.map((s) => s.source).sort()).toEqual(['A saved icon', 'Close']);
  });

  it('keys a string by its content, so a repeated string is translated once', () => {
    expect(keyOf('Get the extension')).toBe(keyOf('Get the extension'));
    expect(keyOf('Get the extension')).not.toBe(keyOf('Get the extensions'));
  });
});

describe('locale paths', () => {
  it('derives a clean URL from a file path', () => {
    expect(pageId('index.html')).toBe('');
    expect(pageId('features/index.html')).toBe('features');
    expect(pageId('features/inline-svg.html')).toBe('features/inline-svg');
  });

  it('prefixes internal links but leaves shared assets alone', () => {
    expect(localizeHref('/features', es)).toBe('/es/features');
    expect(localizeHref('/', es)).toBe('/es/');
    expect(localizeHref('/style.css', es)).toBe('/style.css');
    expect(localizeHref('/fonts/bricolage-var.woff2', es)).toBe('/fonts/bricolage-var.woff2');
    expect(localizeHref('https://github.com/Flozad', es)).toBe('https://github.com/Flozad');
    expect(localizeHref('https://svg.clasicwebtools.com/docs', es)).toBe(
      'https://svg.clasicwebtools.com/es/docs'
    );
  });

  it('leaves every link untouched for the default locale', () => {
    expect(localizeHref('/features', en)).toBe('/features');
    expect(localePath('features', en)).toBe('/features');
    expect(localePath('', en)).toBe('/');
  });
});

describe('injection into the English source', () => {
  const source = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<link rel="canonical" href="https://svg.clasicwebtools.com/docs">',
    '</head>',
    '<body>',
    '<nav class="nav">',
    '  <span class="nav-links">',
    '    <a href="/docs">Docs</a>',
    '  </span>',
    '  <a class="nav-cta" href="#">Get the extension</a>',
    '</nav>',
    '</body>',
    '</html>',
    '',
  ].join('\n');

  it('adds an alternate for every locale, plus x-default', () => {
    const out = injectIntoSource(source, { locale: en, pageId: 'docs' });
    for (const locale of LOCALES) expect(out).toContain(`hreflang="${locale.hreflang}"`);
    expect(out).toContain('hreflang="x-default"');
    expect(out).toContain('href="https://svg.clasicwebtools.com/es/docs"');
  });

  it('adds a switcher that marks the page it is on', () => {
    const out = injectIntoSource(source, { locale: es, pageId: 'docs' });
    expect(out).toContain('<details class="lang-switch">');
    expect(out).toContain(
      '<a href="/es/docs" hreflang="es" lang="es" aria-current="true">Español</a>'
    );
    expect(out).toContain('<a href="/docs" hreflang="en" lang="en">English</a>');
  });

  it('gives back the authored file byte for byte when stripped', () => {
    const out = injectIntoSource(source, { locale: en, pageId: 'docs' });
    expect(out).not.toBe(source);
    expect(stripInjected(out)).toBe(source);
  });

  it('is idempotent: building twice changes nothing', () => {
    const once = injectIntoSource(source, { locale: en, pageId: 'docs' });
    expect(injectIntoSource(once, { locale: en, pageId: 'docs' })).toBe(once);
  });
});
