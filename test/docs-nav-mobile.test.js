import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.join(here, '../docs');
const style = fs.readFileSync(path.join(docs, 'style.css'), 'utf8');
const pages = fs.readFileSync(path.join(docs, 'pages.css'), 'utf8');

// The header is one flex row of five things that want about 1050px together:
// the brand, seven links, the language switcher and the install pill. At a phone
// width it could not shrink that far, so it grew the document instead and every
// page scrolled sideways — svg.clasicwebtools.com measured 868px wide inside a
// 390px viewport, its labels broken mid-word by the squeeze.
//
// These are the parts of the fix a text check can see: the declarations that
// turn "widen the document" into "wrap, pan, or give the wordmark away". The
// layout itself is proved in a browser — serve docs/ and compare
// documentElement.scrollWidth against clientWidth at 390px, then walk every
// authored page. On this fix that is 390/390 with nothing past the right edge.
function block(css, start) {
  const at = css.indexOf(start);
  if (at === -1) throw new Error(`no rule starting with ${start}`);
  const open = css.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unbalanced braces after ${start}`);
}
const query = (q) => block(style, `@media ${q} {`);
const twoRow = query('(max-width: 1050px)');
const small = query('(max-width: 480px)');

describe('the docs header at narrow widths', () => {
  it('adds a row instead of widening the document', () => {
    expect(block(style, '.nav {')).toContain('flex-wrap: wrap');
  });

  it('never breaks a header label mid-word', () => {
    expect(block(style, '.nav-links a {')).toContain('white-space: nowrap');
    expect(block(style, '.nav-links a {')).toContain('flex: none');
    expect(block(style, '.brand strong {')).toContain('white-space: nowrap');
    expect(block(pages, '.nav .nav-cta {')).toContain('white-space: nowrap');
  });

  it('gives the links a row of their own that pans inside it', () => {
    // min-width: 0 is what lets the row be narrower than its content; without
    // overflow-x the content would push the document out again.
    const strip = block(twoRow, '.nav-links {');
    expect(strip).toMatch(/flex:\s*1 1 100%/);
    expect(strip).toContain('min-width: 0');
    expect(strip).toContain('overflow-x: auto');
    expect(twoRow).toContain('.nav .spacer { display: none; }');
  });

  it('keeps brand, language and install pill on the first row', () => {
    expect(block(twoRow, '.brand {')).toContain('flex: 1 1 auto');
    expect(block(twoRow, '.lang-switch {')).toContain('flex: none');
    expect(block(twoRow, '.nav .nav-cta {')).toContain('flex: none');
  });

  it('trades the wordmark for room below 480px, and only visually', () => {
    // The wordmark is what does not fit next to the switcher and the pill, so it
    // moves to the accessibility tree instead of forcing a third row.
    const hidden = block(small, '.brand strong {');
    expect(hidden).toContain('clip-path: inset(50%)');
    expect(hidden).toContain('overflow: hidden');
  });

  it('holds the language menu inside a 320px screen', () => {
    // The menu hangs left from the switcher, so its 150px floor put it off the
    // edge once the switcher sat near the left of the row.
    expect(block(small, '.lang-switch > ul {')).toContain('min-width: 0');
  });
});
