// Turns a page into a flat list of translatable segments and back again.
//
// A segment is the innerHTML of a "leaf" block — an element that holds prose
// rather than more blocks. Keeping whole blocks (rather than bare text nodes)
// means inline markup travels with the sentence, which is what a translator
// needs: <code>, <strong> and links usually move when the grammar does.
//
// Anything that is markup rather than language — inline <svg> icons, images,
// embedded video — is swapped for a {{0}} placeholder before the segment is
// handed out, and restored from the live DOM when the translation is applied.
// Translators copy the placeholder; they never retype a path.

import { createHash } from 'node:crypto';

// Elements that group other elements rather than hold a sentence. The walker
// recurses through these and treats everything else as a leaf — one segment,
// inline markup and all.
const STRUCTURAL_TAGS = new Set([
  'BODY',
  'DIV',
  'SECTION',
  'ARTICLE',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'NAV',
  'MAIN',
  'FIGURE',
  'DETAILS',
  'FORM',
  'FIELDSET',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
  'UL',
  'OL',
  'DL',
  'HGROUP',
  'MENU',
  'SEARCH',
]);

// Structural or empty elements: nothing to translate, nothing to warn about.
const IGNORED_TAGS = new Set([
  'HR',
  'BR',
  'WBR',
  'INPUT',
  'SELECT',
  'OPTION',
  'TEXTAREA',
  'SOURCE',
  'TRACK',
  'PARAM',
  'COL',
  'COLGROUP',
  'AREA',
  'MAP',
  'OBJECT',
  'EMBED',
  'DIALOG',
  'PROGRESS',
  'METER',
  'DEL',
  'INS',
]);

// Never descend into these, and never translate their contents.
const OPAQUE_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'IFRAME', 'PRE', 'CANVAS']);

// Markup, not language: placeholder-ised inside a segment.
const ASSET_TAGS = new Set(['SVG', 'IMG', 'VIDEO', 'PICTURE', 'AUDIO', 'CANVAS', 'IFRAME', 'PRE']);

// Attributes that carry prose, and where to look for them.
const ATTRIBUTE_RULES = [
  { selector: '[alt]', attr: 'alt' },
  { selector: '[aria-label]', attr: 'aria-label' },
  { selector: '[placeholder]', attr: 'placeholder' },
  { selector: '[title]:not(link)', attr: 'title' },
];

const META_CONTENT = [
  'meta[name="description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image:alt"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image:alt"]',
];

// SVG lives in its own namespace, where tagName keeps the authored casing.
const tag = (el) => el.tagName.toUpperCase();

export function keyOf(source) {
  return createHash('sha1').update(source).digest('hex').slice(0, 12);
}

const isBlank = (s) => !s?.trim();

function isOpaque(el) {
  return (
    OPAQUE_TAGS.has(tag(el)) || ASSET_TAGS.has(tag(el)) || el.getAttribute('translate') === 'no'
  );
}

// Serialise a leaf's innerHTML, replacing asset subtrees with {{n}}.
function serialize(el) {
  const assets = [];
  const parts = [];
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      parts.push(escapeText(node.data));
    } else if (node.nodeType === 8) {
      parts.push(`<!--${node.data}-->`);
    } else if (node.nodeType === 1) {
      if (ASSET_TAGS.has(tag(node)) || OPAQUE_TAGS.has(tag(node))) {
        parts.push(`{{${assets.length}}}`);
        assets.push(node.outerHTML);
      } else {
        const inner = serialize(node);
        assets.push(...inner.assets.map(() => null)); // keep indices global
        parts.push(`${openTag(node)}${reindex(inner, assets)}</${node.tagName.toLowerCase()}>`);
      }
    }
  }
  return { source: parts.join(''), assets };
}

// Nested serialise() calls number their placeholders from 0; splice them into
// the parent's numbering so a segment has one flat placeholder list.
function reindex(inner, assets) {
  const base = assets.length - inner.assets.length;
  for (let i = 0; i < inner.assets.length; i += 1) assets[base + i] = inner.assets[i];
  return inner.source.replace(/\{\{(\d+)\}\}/g, (_, n) => `{{${base + Number(n)}}}`);
}

function openTag(el) {
  const attrs = [...el.attributes].map((a) => ` ${a.name}="${escapeAttr(a.value)}"`).join('');
  return `<${el.tagName.toLowerCase()}${attrs}>`;
}

const escapeText = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, '&nbsp;');
const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/ /g, '&nbsp;');

function restore(translated, assets, onError) {
  return translated.replace(/\{\{(\d+)\}\}/g, (whole, n) => {
    const asset = assets[Number(n)];
    if (asset === undefined) {
      onError?.(`unknown placeholder ${whole}`);
      return '';
    }
    return asset;
  });
}

// Collect every translatable segment in document order.
// Each segment exposes `source` (what a translator sees) and `apply(value)`.
export function collectSegments(doc, { onWarn } = {}) {
  const segments = [];

  const push = (type, source, apply) => {
    if (isBlank(source)) return;
    segments.push({ type, source: source.trim(), apply });
  };

  const title = doc.querySelector('title');
  if (title)
    push('meta', title.textContent, (v) => {
      title.textContent = v;
    });

  for (const selector of META_CONTENT) {
    for (const meta of doc.querySelectorAll(selector)) {
      push('meta', meta.getAttribute('content'), (v) => meta.setAttribute('content', v));
    }
  }

  for (const { selector, attr } of ATTRIBUTE_RULES) {
    for (const el of doc.querySelectorAll(selector)) {
      if (el.closest('svg')) continue; // aria-label on a decorative icon's guts
      push('attr', el.getAttribute(attr), (v) => el.setAttribute(attr, v));
    }
  }

  // A wrapper whose children are all elements — a row of nav links, a pair of
  // buttons — is structural too, even if its tag says otherwise. What makes an
  // element a leaf is loose text: that text is part of a sentence the markup
  // around it belongs to.
  const isStructural = (el) => {
    if (STRUCTURAL_TAGS.has(tag(el))) return true;
    if (el.children.length < 2) return false;
    return [...el.childNodes].every(
      (n) => n.nodeType === 1 || (n.nodeType === 3 && isBlank(n.data))
    );
  };

  const walk = (el) => {
    for (const child of [...el.children]) {
      if (isOpaque(child) || IGNORED_TAGS.has(tag(child))) continue;
      if (isStructural(child)) {
        const stray = [...child.childNodes].some((n) => n.nodeType === 3 && !isBlank(n.data));
        if (stray)
          onWarn?.(
            `text mixed with blocks in <${child.tagName.toLowerCase()} class="${child.className}">`
          );
        walk(child);
        continue;
      }
      if (isBlank(child.textContent)) continue;
      const { source, assets } = serialize(child);
      push('html', source, (v) => {
        child.innerHTML = restore(v, assets, (m) => onWarn?.(`${m} in segment`));
      });
    }
  };
  walk(doc.body);

  return segments;
}

export { restore, serialize };
