// Render an untrusted, page-derived SVG as an *image*, never as live markup in
// the privileged popup DOM. An <img src=blob:…> is rendered in a restricted
// mode — no scripts, no external resource loads, no interaction with the host
// document, and its CSS cannot escape the image. That is a browser-level
// guarantee, not a sanitizer we have to maintain.
//
// Takes SVG *markup*, never a URL. Remote SVGs are fetched to markup by the
// caller (through the content script, at page origin) before they get here —
// pointing this <img> straight at a page-controlled URL would make the
// extension origin issue an attacker-attributable request, leaking that the
// extension is installed along with the user's IP and popup-open timing.
//
// Returns the object URL it created so the caller can hand it back on the next
// call to be revoked.
export function renderPreview(previewEl, markup, previousObjectUrl) {
  if (previousObjectUrl) {
    URL.revokeObjectURL(previousObjectUrl);
  }

  const img = document.createElement('img');
  img.className = 'max-w-full max-h-full object-contain';

  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  img.src = objectUrl;

  img.onerror = () => {
    previewEl.textContent = 'This SVG could not be previewed.';
  };

  // A near-white icon vanishes on the light preview plate. Once the image
  // paints, sample it and flip to a dark backdrop when the visible artwork is
  // predominantly light. Default to the light plate on any failure.
  previewEl.classList.remove('on-dark');
  img.addEventListener('load', () => {
    try {
      if (isMostlyLight(img)) previewEl.classList.add('on-dark');
    } catch {
      // Canvas can taint (e.g. an <image> to a cross-origin href), making
      // pixels unreadable — leave the light plate rather than guess.
    }
  });

  previewEl.replaceChildren(img);
  return objectUrl;
}

// Draw the image small and inspect its visible (non-transparent) pixels. Return
// true when they are overwhelmingly near-white, so the artwork would disappear
// against a light background. Ignores transparent pixels entirely.
function isMostlyLight(img) {
  const SIZE = 48;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SIZE, SIZE);

  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  let visible = 0;
  let light = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 24) continue; // effectively transparent
    visible++;
    // Perceived luminance on 0–255. Treat very bright pixels as "light".
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (lum > 230) light++;
  }

  // Require a meaningful amount of drawn content so a stray light speck on an
  // otherwise empty canvas doesn't trigger the flip.
  if (visible < SIZE * SIZE * 0.01) return false;
  return light / visible > 0.9;
}
