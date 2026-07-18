const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// An undeclared `xlink:` prefix is a namespace error that makes DOMParser
// return a <parsererror> document. Declare it on the root <svg> tag *before*
// parsing so the file stays well-formed XML.
function ensureXlinkDeclared(content) {
  if (!content.includes('xlink:')) return content;

  const openTag = content.match(/<svg\b[^>]*>/i);
  if (!openTag) return content;

  const tag = openTag[0];
  if (/\bxmlns:xlink\s*=/i.test(tag)) return content;

  const patched = tag.slice(0, tag.length - 1) + ` xmlns:xlink="${XLINK_NS}"` + tag.slice(tag.length - 1);
  return content.replace(tag, patched);
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

  // A standalone .svg file without an xmlns is not a valid SVG image. HTML
  // serialization (svg.outerHTML) omits it on most sites, so add it here.
  if (!doc.documentElement.getAttribute('xmlns')) {
    doc.documentElement.setAttribute('xmlns', SVG_NS);
  }

  const serializer = new XMLSerializer();
  let output = serializer.serializeToString(doc);

  if (!output.startsWith('<?xml')) {
    output = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + output;
  }

  return output;
}

// Chrome's downloads.download rejects filenames that are absolute, contain
// `..`, or end in a separator; Windows additionally forbids <>:"/\|?* and a set
// of reserved device names. Return a safe, non-empty name (falling back when
// nothing usable survives). Spaces and accents are intentionally preserved;
// only the forbidden characters and control characters are replaced.
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFilename(name, fallback) {
  const cleaned = (name || '')
    .trim()
    .replace(/\.svg$/i, '')          // user may have typed the extension themselves
    .replace(INVALID_FILENAME_CHARS, '-')
    .replace(/\.+/g, '.')            // collapse dot runs, killing '..'
    .replace(/^[.\s]+|[.\s]+$/g, '') // no leading/trailing dots or spaces
    .slice(0, 100);

  if (!cleaned || RESERVED_NAMES.test(cleaned)) {
    return `${fallback}.svg`;
  }
  return `${cleaned}.svg`;
}
