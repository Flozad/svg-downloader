// Service worker: owns the right-click "Save this as SVG" menu. The heavy work
// — finding the graphic, resolving external sprites, sanitizing — happens in the
// content script, which has a DOM and runs at page origin. A service worker has
// neither DOMParser nor URL.createObjectURL, so it only routes: inject the
// content script, ask it for a finished, sanitized file, and hand that to
// chrome.downloads as a data: URL. No file:/system access, no host permissions.

const MENU_ID = 'save-svg';

// Menu items are per-profile, not per-worker: creating one that already exists
// throws. Remove-all then create on install and startup keeps it idempotent.
export function createMenu() {
  chrome.contextMenus.removeAll(() => {
    void chrome.runtime.lastError;
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Save this as SVG',
      // Offered on images and general page targets (inline <svg>, CSS
      // backgrounds). Restricted to real web pages — the content script can't be
      // injected into chrome:// or the Web Store anyway.
      contexts: ['image', 'page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  });
}

// Same hard blocks the popup applies: Chrome refuses executeScript on its own
// gallery pages even over https.
function isRestrictedUrl(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return true;
  }
  return (
    host === 'chrome.google.com' ||
    host === 'chromewebstore.google.com' ||
    host === 'addons.mozilla.org' ||
    host === 'microsoftedge.microsoft.com'
  );
}

export async function saveSvgFromTab(tab) {
  if (!tab?.id || !tab.url?.startsWith('http') || isRestrictedUrl(tab.url)) {
    return;
  }

  try {
    // Inject on demand (activeTab is granted by the user's menu click), then ask
    // the content script for a sanitized standalone file.
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'saveRightClicked' });
    if (!response?.success) return;

    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(response.content)}`;
    await chrome.downloads.download({ url, filename: response.filename, saveAs: false });
  } catch (error) {
    // A closed tab, a page that navigated away, or an unreachable content
    // script. Nothing actionable and no UI surface here, so log and move on.
    console.error('Save this as SVG failed:', error);
  }
}

function onClicked(info, tab) {
  if (info.menuItemId === MENU_ID) {
    saveSvgFromTab(tab);
  }
}

// Guarded so importing this module under a bare test harness (no chrome.*) is
// inert; a real worker always has these APIs.
if (globalThis.chrome?.contextMenus) {
  chrome.runtime.onInstalled.addListener(createMenu);
  chrome.runtime.onStartup?.addListener?.(createMenu);
  chrome.contextMenus.onClicked.addListener(onClicked);
}

export { isRestrictedUrl, MENU_ID, onClicked };
