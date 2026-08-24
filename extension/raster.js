// Rasterize SVG markup to a PNG or JPEG blob. Runs in the popup, which has a
// real <canvas>; the content script and the service worker do not, so this is
// deliberately popup-only. The SVG is drawn through the same sandboxed
// `<img src="blob:…">` the preview uses — no scripts run, no external resources
// load — so this never executes page-derived markup even while rendering it.

const DEFAULT_SIZE = 512;
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// The intrinsic pixel size to rasterize at 1×. Prefer explicit width/height,
// fall back to the viewBox's extent, and finally to a square default so a
// dimensionless icon (viewBox-less, common for inline symbols) still produces a
// sensibly sized raster rather than the 300×150 canvas default.
export function svgIntrinsicSize(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName === 'parsererror') {
    return { width: DEFAULT_SIZE, height: DEFAULT_SIZE };
  }

  const w = parseLength(root.getAttribute('width'));
  const h = parseLength(root.getAttribute('height'));
  if (w && h) return { width: w, height: h };

  const box = parseViewBox(root.getAttribute('viewBox'));
  if (box) {
    // One known dimension pins the other through the viewBox aspect ratio.
    if (w) return { width: w, height: (w * box.height) / box.width };
    if (h) return { width: (h * box.width) / box.height, height: h };
    return { width: box.width, height: box.height };
  }

  if (w) return { width: w, height: w };
  if (h) return { width: h, height: h };
  return { width: DEFAULT_SIZE, height: DEFAULT_SIZE };
}

// Only unitless or px lengths map cleanly to raster pixels. A percentage or a
// physical unit (em, %, mm) has no fixed pixel size out of page context, so it
// is treated as unknown and the viewBox/default path takes over.
function parseLength(value) {
  if (!value) return null;
  const match = /^\s*([0-9]*\.?[0-9]+)\s*(px)?\s*$/i.exec(value);
  if (!match) return null;
  const n = Number.parseFloat(match[1]);
  return n > 0 ? n : null;
}

function parseViewBox(value) {
  if (!value) return null;
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  const [, , width, height] = parts;
  return width > 0 && height > 0 ? { width, height } : null;
}

// Load SVG markup into an <img> so it can be drawn to a canvas. Rejects on a
// decode error rather than leaving a blank canvas.
function loadImage(markup) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This SVG could not be rendered.'));
    };
    img.src = url;
  });
}

// Rasterize `markup` to a blob. `scale` multiplies the intrinsic size (2 → @2x).
// JPEG has no alpha, so a background is painted (white by default); PNG keeps
// transparency. A canvas tainted by a cross-origin <image href> inside the SVG
// makes toBlob throw SecurityError — surfaced as a clear message rather than a
// silent failure. `Math.round`/clamp keep the canvas within sane bounds.
export async function rasterizeSvg(markup, { format = 'png', scale = 1, background = null } = {}) {
  const type = MIME[format] || MIME.png;
  const { width, height } = svgIntrinsicSize(markup);

  const MAX_DIM = 8192; // a canvas edge Chrome will reliably allocate
  const canvasW = Math.min(MAX_DIM, Math.max(1, Math.round(width * scale)));
  const canvasH = Math.min(MAX_DIM, Math.max(1, Math.round(height * scale)));

  const img = await loadImage(markup);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  const fill = background || (type === 'image/jpeg' ? '#ffffff' : null);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
  ctx.drawImage(img, 0, 0, canvasW, canvasH);

  return await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('This SVG could not be converted.'));
      }, type);
    } catch {
      // toBlob throws synchronously on a tainted canvas in some engines.
      reject(new Error('This SVG embeds a cross-origin image and could not be converted.'));
    }
  });
}
