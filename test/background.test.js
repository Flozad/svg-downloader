import { beforeEach, describe, expect, it, vi } from 'vitest';

// The service worker registers listeners at import time when chrome.contextMenus
// exists, so install the mock *before* importing it, then re-import fresh so the
// onInstalled/onClicked wiring is exercised too.
function installChrome() {
  const menus = {
    removeAll: vi.fn((cb) => cb?.()),
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  };
  const chrome = {
    runtime: {
      lastError: null,
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
    },
    contextMenus: menus,
    scripting: { executeScript: vi.fn(async () => {}) },
    tabs: {
      sendMessage: vi.fn(async () => ({ success: true, content: '<svg/>', filename: 'x.svg' })),
    },
    downloads: { download: vi.fn(async () => 1) },
  };
  globalThis.chrome = chrome;
  return chrome;
}

async function load() {
  vi.resetModules();
  const chrome = installChrome();
  const mod = await import('../extension/background.js');
  return { chrome, mod };
}

describe('background.js — menu wiring', () => {
  it('registers the menu and click listeners at import', async () => {
    const { chrome } = await load();
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
    expect(chrome.contextMenus.onClicked.addListener).toHaveBeenCalled();
  });

  it('creates a single menu item idempotently (removeAll first)', async () => {
    const { chrome, mod } = await load();
    mod.createMenu();
    expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: mod.MENU_ID, contexts: ['image', 'page'] })
    );
  });
});

describe('background.js — isRestrictedUrl', () => {
  it('blocks the web store and add-on galleries', async () => {
    const { mod } = await load();
    expect(mod.isRestrictedUrl('https://chromewebstore.google.com/x')).toBe(true);
    expect(mod.isRestrictedUrl('https://addons.mozilla.org/x')).toBe(true);
    expect(mod.isRestrictedUrl('not a url')).toBe(true);
    expect(mod.isRestrictedUrl('https://example.com/')).toBe(false);
  });
});

describe('background.js — saveSvgFromTab', () => {
  let saveSvgFromTab;
  let chrome;

  beforeEach(async () => {
    const loaded = await load();
    chrome = loaded.chrome;
    ({ saveSvgFromTab } = loaded.mod);
  });

  it('injects, asks the content script, and downloads a data URL', async () => {
    await saveSvgFromTab({ id: 7, url: 'https://example.com/' });

    expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['content.js'],
    });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(7, { action: 'saveRightClicked' });
    const [[opts]] = chrome.downloads.download.mock.calls;
    expect(opts.filename).toBe('x.svg');
    expect(opts.url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
  });

  it('skips restricted and non-http tabs without injecting', async () => {
    await saveSvgFromTab({ id: 7, url: 'chrome://extensions' });
    await saveSvgFromTab({ id: 7, url: 'https://chrome.google.com/webstore' });
    await saveSvgFromTab({ url: 'https://example.com/' }); // no id
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('does not download when the content script reports no SVG', async () => {
    chrome.tabs.sendMessage.mockResolvedValueOnce({ success: false, error: 'No SVG found here' });
    await saveSvgFromTab({ id: 7, url: 'https://example.com/' });
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('swallows an injection failure without throwing', async () => {
    chrome.scripting.executeScript.mockRejectedValueOnce(new Error('tab closed'));
    await expect(saveSvgFromTab({ id: 7, url: 'https://example.com/' })).resolves.toBeUndefined();
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });
});

describe('background.js — onClicked routing', () => {
  it('acts only on its own menu item', async () => {
    const { chrome, mod } = await load();
    mod.onClicked({ menuItemId: 'something-else' }, { id: 7, url: 'https://example.com/' });
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();

    mod.onClicked({ menuItemId: mod.MENU_ID }, { id: 7, url: 'https://example.com/' });
    // saveSvgFromTab is async; give the injected microtasks a tick.
    await Promise.resolve();
    expect(chrome.scripting.executeScript).toHaveBeenCalled();
  });
});
