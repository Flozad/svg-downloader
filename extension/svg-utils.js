const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// Match the root <svg> open tag, skipping over `>` that appears inside a quoted
// attribute value. A naive `[^>]*` stops at the first `>` even mid-attribute,
// which spliced the xmlns declaration into the middle of a value.
const SVG_OPEN_TAG = /<svg\b(?:[^>"']|"[^"]*"|'[^']*')*>/i;

// An undeclared `xlink:` prefix is a namespace error that makes DOMParser
// return a <parsererror> document. Declare it on the root <svg> tag *before*
// parsing so the file stays well-formed XML.
function ensureXlinkDeclared(content) {
  if (!content.includes('xlink:')) return content;

  const openTag = content.match(SVG_OPEN_TAG);
  if (!openTag) return content;

  const tag = openTag[0];
  if (/\bxmlns:xlink\s*=/i.test(tag)) return content;

  // Insert before the tag terminator, keeping a self-closing `/>` intact.
  const end = tag.endsWith('/>') ? tag.length - 2 : tag.length - 1;
  const patched = `${tag.slice(0, end)} xmlns:xlink="${XLINK_NS}"${tag.slice(end)}`;

  // Splice by index rather than String.replace: a `$'` or `$&` sequence in the
  // page's own markup would otherwise be expanded as a replacement pattern and
  // duplicate arbitrary content into the output.
  return content.slice(0, openTag.index) + patched + content.slice(openTag.index + tag.length);
}

// Elements that make a saved .svg an executable document rather than an image.
// A downloaded file is opened from file:// or inlined into the user's own site,
// where any of these run with that origin's privileges.
const FORBIDDEN_ELEMENTS = new Set(['script', 'foreignobject', 'handler', 'listener']);

// Attributes whose value is fetched or navigated to. Matched on localName plus
// namespace, never on the literal prefix: `xlink:` is only a convention, and a
// document is free to bind the XLink namespace to any prefix it likes. Matching
// the string 'xlink:href' let `<a xl:href="javascript:...">` through untouched.
const URL_LOCAL_NAMES = new Set(['href', 'src']);

function isUrlAttribute(attr) {
  if (!URL_LOCAL_NAMES.has(attr.localName?.toLowerCase())) return false;
  return attr.namespaceURI === null || attr.namespaceURI === XLINK_NS;
}

// A scheme is anything up to the first colon that parses as one. No scheme at
// all means a relative URL, which cannot carry an executable payload.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
// `data:image/svg+xml` is deliberately absent. It is the one image type in this
// list that carries markup, so `<a href="data:image/svg+xml,<svg onload=...>">`
// would round-trip a script past every other check here. Chrome blocks
// top-level data: navigation today, which is the only reason that is not
// already live — and no legitimate `<image>`/`<use>` needs the scheme.
const SAFE_SCHEME = /^(https?:|mailto:|data:image\/(png|jpe?g|gif|webp)[;,])/i;

// Reject by scheme rather than allow-list by shape. The allow-list version also
// rejected every *relative* URL, so `<use href="sprite.svg#i">` and
// `<image href="logo.png">` came out stripped — a silently blank download.
function isSafeUrl(value) {
  const normalized = stripInvisible(value);
  if (normalized.startsWith('#')) return true;
  if (!HAS_SCHEME.test(normalized)) return true; // relative
  return SAFE_SCHEME.test(normalized);
}

// Drop whitespace and C0/C1 controls by code point rather than by regex: the
// character class this needs is exactly the one Biome forbids in a literal, and
// an explicit loop states the intent more plainly anyway.
function stripInvisible(value) {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code > 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

// Animation elements can rewrite another element's attribute after load, which
// reintroduces exactly what the attribute pass just removed — one tick later.
// Both halves matter: `attributeName="href"` restores a javascript: URL, and
// `attributeName="onmouseover"` restores an event handler.
//
// Keyed on the presence of `attributeName` rather than on a list of animation
// tags. The list version had to enumerate every element SMIL has ever defined,
// and missed `animateColor` — a real passthrough, since only Blink's removal of
// the element in Chrome 49 stopped it working. Nothing but an animation element
// carries `attributeName`, so the inverted test is both tighter and shorter.

// The attributeName is a QName written by the attacker, so compare on the local
// part — `xl:href` and `xlink:href` both target href.
function targetsDangerousAttribute(attributeName) {
  if (!attributeName) return false;
  const local = attributeName.trim().toLowerCase().split(':').pop();
  return URL_LOCAL_NAMES.has(local) || local.startsWith('on');
}

// CSS is not stripped wholesale. Illustrator, Figma and Inkscape all emit
// `<style>` blocks and `style=` attributes carrying nothing but fill/stroke, and
// dropping those would repaint every export flat — the "downloads but opens
// wrong" failure this whole path exists to avoid. Only the two constructs that
// reach the network or pull in outside rules are neutralized:
//
//   @import  — unconditionally fetches a third-party stylesheet, on file:// too
//   url(...) — same, via background-image and friends
//
// `url(#id)` is left alone: local references are how gradients, masks, filters
// and clip-paths are wired up, and they touch nothing outside the document.
//
// This is a serializer-level scrub, not a CSS parser. A determined author can
// hide `@import` behind CSS escapes (`\40 import`). That is acceptable here —
// the payoff is a beacon in a document that already has no script, no event
// handlers and no external href, and the alternative is shipping a CSS parser.
const CSS_IMPORT_RE = /@import[^;]*;?/gi;
const CSS_URL_RE = /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi;

function sanitizeCssText(css) {
  return css.replace(CSS_IMPORT_RE, '').replace(CSS_URL_RE, (match, _quote, value) => {
    const target = stripInvisible(value);
    return target.startsWith('#') ? match : 'none';
  });
}

function sanitizeSvgDoc(doc) {
  // Strip the declaration from the *output*. Note this is not entity-expansion
  // protection for this process — parseFromString has already run by the time
  // we get here — it stops the subset being re-expanded by whatever opens the
  // saved file next.
  if (doc.doctype) doc.removeChild(doc.doctype);

  for (const el of [...doc.querySelectorAll('*')]) {
    const tag = el.localName?.toLowerCase();

    if (FORBIDDEN_ELEMENTS.has(tag)) {
      el.remove();
      continue;
    }

    if (targetsDangerousAttribute(el.getAttribute('attributeName'))) {
      el.remove();
      continue;
    }

    if (tag === 'style') {
      el.textContent = sanitizeCssText(el.textContent || '');
      continue;
    }

    for (const attr of [...el.attributes]) {
      // Event handlers: onload, onclick, onbegin, onmouseover, ...
      if (attr.localName?.toLowerCase().startsWith('on')) {
        el.removeAttributeNode(attr);
        continue;
      }

      if (attr.localName?.toLowerCase() === 'style') {
        attr.value = sanitizeCssText(attr.value);
        continue;
      }

      if (isUrlAttribute(attr) && !isSafeUrl(attr.value)) {
        el.removeAttributeNode(attr);
      }
    }
  }
}

export async function formatSVGContent(content) {
  content = content.trim();

  // If it's just a path or other element without an <svg> wrapper, wrap it.
  if (!content.includes('<svg')) {
    content = `<svg xmlns="${SVG_NS}">\n${content}\n</svg>`;
  }

  content = ensureXlinkDeclared(content);

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');

  // DOMParser does not throw on malformed input — it returns a document whose
  // root is <parsererror>. Detect that and fail loudly.
  if (doc.querySelector('parsererror') || doc.documentElement.nodeName === 'parsererror') {
    throw new Error('Invalid SVG markup');
  }

  // Strip active content before anything is written to disk. A saved .svg is a
  // live document: opened from file:// its scripts run, and pasted into a CMS
  // that inlines SVG it becomes stored XSS in the user's own origin. This is
  // the single choke point — every download path routes through here.
  sanitizeSvgDoc(doc);

  // A standalone .svg file without an xmlns is not a valid SVG image. HTML
  // serialization (svg.outerHTML) omits it on most sites, so add it here.
  if (!doc.documentElement.getAttribute('xmlns')) {
    doc.documentElement.setAttribute('xmlns', SVG_NS);
  }

  const serializer = new XMLSerializer();
  let output = serializer.serializeToString(doc);

  if (!output.startsWith('<?xml')) {
    output = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${output}`;
  }

  return output;
}

// Chrome's downloads.download rejects filenames that are absolute, contain
// `..`, or end in a separator; Windows additionally forbids <>:"/\|?* and a set
// of reserved device names. Return a safe, non-empty name (falling back when
// nothing usable survives). Spaces and accents are intentionally preserved;
// only the forbidden characters and control characters are replaced.
// The bidi/invisible ranges are included because a right-to-left override
// makes a typed name render in the download shelf as though it had a
// different extension. The real extension is still .svg, so this is display
// spoofing rather than execution — but the shelf is exactly where the user
// decides whether to trust the file.
const INVALID_FILENAME_CHARS =
  /[<>:"/\\|?*\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g;
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// Clean a name to its bare (extension-less) form. Order matters: the path
// separators are destroyed *before* dot runs are collapsed, so `../../etc` can
// never reassemble into a traversal; and the length cap is applied *before* the
// final trim, so truncating mid-name cannot leave a trailing dot that would
// join the appended extension into a `..` and get the download rejected.
// Returns '' when nothing usable survives.
export function sanitizeNamePart(name) {
  const capped = (name || '')
    .trim()
    .replace(/\.svg$/i, '') // user may have typed the extension themselves
    .replace(INVALID_FILENAME_CHARS, '-')
    .replace(/\.+/g, '.'); // collapse dot runs, killing '..'

  // Truncate by code point, not UTF-16 unit: a bare .slice can split a
  // surrogate pair and leave a lone surrogate in the name handed to
  // chrome.downloads.
  const cleaned = [...capped]
    .slice(0, 100)
    .join('')
    .replace(/^[.\s]+|[.\s]+$/g, ''); // no leading/trailing dots or spaces

  // Windows reserves these device names with *any* extension (CON.txt too), so
  // test the basename rather than the whole string.
  if (RESERVED_NAMES.test(cleaned.split('.')[0])) return '';
  return cleaned;
}

export function sanitizeFilename(name, fallback) {
  const cleaned = sanitizeNamePart(name);
  return cleaned ? `${cleaned}.svg` : `${fallback}.svg`;
}
