// Async Clipboard API wrappers. The popup is a focused, secure-context document
// (chrome-extension://), and every call here runs from a user gesture (a button
// click), which is exactly the condition under which the clipboard is writable
// without any extra permission — so the extension keeps its minimal permission
// set. Both functions reject on failure so the caller can show a status line
// rather than failing silently.

export async function copyText(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard is unavailable.');
  }
  await navigator.clipboard.writeText(text);
}

// Write an image blob (typically a PNG) to the clipboard as a ClipboardItem,
// so it pastes as a picture into docs, chat and design tools — the reason most
// non-developers want an icon off a page at all.
export async function copyImage(blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('Copying images is not supported in this browser.');
  }
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
