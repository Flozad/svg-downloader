// Render an untrusted, page-derived SVG as an *image*, never as live markup in
// the privileged popup DOM. An <img src=blob:…> is rendered in a restricted
// mode — no scripts, no external resource loads, no interaction with the host
// document, and its CSS cannot escape the image. That is a browser-level
// guarantee, not a sanitizer we have to maintain.
//
// Returns the object URL it created (or null for a URL-backed image) so the
// caller can hand it back on the next call to be revoked.
export function renderPreview(previewEl, svg, previousObjectUrl) {
  if (previousObjectUrl) {
    URL.revokeObjectURL(previousObjectUrl);
  }

  const img = document.createElement('img');
  img.className = 'max-w-full max-h-full object-contain';

  let objectUrl = null;
  if (svg.type === 'svg') {
    const blob = new Blob([svg.content], { type: 'image/svg+xml;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
  } else {
    img.src = svg.content;
  }

  img.onerror = () => {
    previewEl.textContent = 'This SVG could not be previewed.';
  };

  previewEl.replaceChildren(img);
  return objectUrl;
}
