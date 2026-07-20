import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  await flush();
  await flush();
  await flush();
};

const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>';

// The content-script ↔ popup message channel is mocked here; each test swaps
// `sendMessageImpl` to shape the content script's answers for that scenario.
let runtimeListener = null;
let sendMessageImpl = async () => ({ success: true });

// Which tab chrome.tabs.query answers with. Swapped per test to exercise the
// restricted / non-http URL guards, reset in beforeEach.
const DEFAULT_TAB = { id: 1, url: 'https://example.com/' };
let activeTab = DEFAULT_TAB;

beforeAll(async () => {
  // Real popup DOM, scripts stripped, so element ids never drift from source.
  const html = fs.readFileSync(path.join(here, '../extension/popup.html'), 'utf8');
  const body = html
    .slice(html.indexOf('<body'), html.indexOf('</body>'))
    .replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body.slice(body.indexOf('>') + 1);

  const downloadListeners = new Set();
  globalThis.chrome = {
    storage: { sync: { get: vi.fn(async () => ({})) } },
    tabs: {
      query: vi.fn(async () => [activeTab]),
      // The re-inject recovery path resolves the pinned tab by id rather than
      // re-running an "active tab" query.
      get: vi.fn(async (id) => ({ ...activeTab, id })),
      sendMessage: vi.fn((tabId, msg) => sendMessageImpl(tabId, msg)),
    },
    scripting: { executeScript: vi.fn(async () => {}) },
    runtime: {
      onMessage: {
        addListener: (fn) => {
          runtimeListener = fn;
        },
      },
      openOptionsPage: vi.fn(),
      lastError: null,
    },
    // downloadBlob holds the object URL until the download reaches a terminal
    // state, so the mock has to model onChanged and actually fire it — a
    // download that never completes would otherwise hang the awaiting caller.
    downloads: {
      download: vi.fn(async () => {
        queueMicrotask(() => {
          for (const fn of downloadListeners) {
            fn({ id: 1, state: { current: 'complete' } });
          }
        });
        return 1;
      }),
      onChanged: {
        addListener: (fn) => downloadListeners.add(fn),
        removeListener: (fn) => downloadListeners.delete(fn),
      },
    },
  };
  globalThis.JSZip = class {
    constructor() {
      this.files = {};
    }
    file(name, content) {
      this.files[name] = content;
    }
    async generateAsync() {
      return new Blob(['zip']);
    }
  };
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake');
  globalThis.URL.revokeObjectURL = vi.fn();

  // Import once — popup.js registers its DOMContentLoaded listener at module
  // scope; re-importing would stack listeners on the shared jsdom document.
  await import('../extension/popup.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await settle();
});

beforeEach(() => {
  vi.clearAllMocks();
  sendMessageImpl = async () => ({ success: true });
  activeTab = DEFAULT_TAB;

  // Neutral baseline: nothing loading, no error/status showing, controls
  // enabled so `.click()` dispatches (jsdom drops clicks on disabled buttons).
  for (const id of ['refreshBtn', 'downloadBtn', 'downloadAllBtn', 'prevBtn', 'nextBtn']) {
    document.getElementById(id).disabled = false;
  }
  const status = document.getElementById('status');
  status.classList.add('hidden');
  status.textContent = '';
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('preview').classList.add('hidden');
  document.getElementById('counter').textContent = '0 found';
  document.getElementById('filenameInput').value = '';
});

function send(action, data) {
  runtimeListener({ action, data }, {}, () => {});
}

// Establish a populated state (enables the download buttons) with `total` items.
function selectFirst(total = 2) {
  send('svgsCollected', { count: total, skipped: 0 });
  send('elementSelected', { type: 'svg', content: VALID_SVG, currentIndex: 0, total });
}

describe('popup.js — startup & message handling (plan 010)', () => {
  it('injects the content script and requests a scan on open', () => {
    // The one-time startup refresh ran in beforeAll (before clearAllMocks), so
    // assert the contract via a fresh scan triggered by the refresh button.
    document.getElementById('refreshBtn').click();
    return settle().then(() => {
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({ files: ['content.js'] })
      );
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'collectSVGs' });
    });
  });

  it('shows the empty state and disables controls when no SVGs are found', () => {
    send('svgsCollected', { count: 0, skipped: 0 });
    expect(document.getElementById('counter').textContent).toBe('0 found');
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(false);
    for (const id of ['prevBtn', 'nextBtn', 'downloadBtn', 'downloadAllBtn']) {
      expect(document.getElementById(id).disabled).toBe(true);
    }
  });

  it('renders the preview and sets nav state on the first item', () => {
    selectFirst(2);
    expect(document.getElementById('preview').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('preview').querySelector('img')).not.toBeNull();
    expect(document.getElementById('prevBtn').disabled).toBe(true);
    expect(document.getElementById('nextBtn').disabled).toBe(false);
    expect(document.getElementById('downloadBtn').disabled).toBe(false);
  });

  it('flips nav state on the last item', () => {
    send('svgsCollected', { count: 2, skipped: 0 });
    send('elementSelected', { type: 'svg', content: VALID_SVG, currentIndex: 1, total: 2 });
    expect(document.getElementById('prevBtn').disabled).toBe(false);
    expect(document.getElementById('nextBtn').disabled).toBe(true);
  });

  it('downloads the current SVG with the default filename', async () => {
    selectFirst(2);
    document.getElementById('filenameInput').value = '';
    document.getElementById('downloadBtn').click();
    await settle();
    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'svg-1.svg' })
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('sanitizes a custom filename, preserving spaces', async () => {
    selectFirst(2);
    document.getElementById('filenameInput').value = 'my icon.svg';
    document.getElementById('downloadBtn').click();
    await settle();
    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'my icon.svg' })
    );
  });
});

describe('popup.js — navigation payload is slim (plan 012)', () => {
  it('renders the preview from an elementSelected message that carries no full list', () => {
    // No `allSVGs` key on the message — the popup must not depend on it.
    send('svgsCollected', { count: 3, skipped: 0 });
    send('elementSelected', { type: 'svg', content: VALID_SVG, currentIndex: 1, total: 3 });
    expect(document.getElementById('preview').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('pagerPos').textContent).toBe('02 / 03');
  });
});

describe('popup.js — ZIP outcomes (plan 011)', () => {
  it('reports partial success as a status notice without wrecking the UI', async () => {
    selectFirst(2);
    const counterBefore = document.getElementById('counter').textContent;
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return {
          success: true,
          svgs: [
            { type: 'svg', content: VALID_SVG },
            { type: 'img', content: 'https://cdn.example/x.svg' },
          ],
        };
      }
      if (msg.action === 'fetchSVG') return { success: false, error: 'HTTP 403' };
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    expect(document.getElementById('status').textContent).toMatch(/Downloaded 1 of 2/);
    expect(document.getElementById('preview').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('counter').textContent).toBe(counterBefore);
    expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'all-svgs.zip' })
    );
  });

  it('confirms a fully successful ZIP with a status line', async () => {
    selectFirst(2);
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return {
          success: true,
          svgs: [
            { type: 'svg', content: VALID_SVG },
            { type: 'svg', content: VALID_SVG.replace('r="4"', 'r="5"') },
          ],
        };
      }
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    expect(document.getElementById('status').textContent).toMatch(/Downloaded 2 SVGs/);
    expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
  });

  it('keeps the destructive error state when every SVG fails', async () => {
    selectFirst(1);
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return { success: true, svgs: [{ type: 'img', content: 'https://cdn.example/x.svg' }] };
      }
      if (msg.action === 'fetchSVG') return { success: false, error: 'HTTP 403' };
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    const empty = document.getElementById('empty-state');
    expect(empty.classList.contains('hidden')).toBe(false);
    expect(empty.querySelector('p').textContent).toBe(
      'None of the SVGs on this page could be exported.'
    );
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });
});

describe('popup.js — injection failure recovery (plan 014)', () => {
  it('retries once on a connection error and then succeeds', async () => {
    let collectCalls = 0;
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'collectSVGs') {
        collectCalls++;
        if (collectCalls === 1) {
          throw new Error('Could not establish connection. Receiving end does not exist.');
        }
        return { success: true };
      }
      return { success: true };
    };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
    // No error surfaced — the popup sits in its loading state awaiting results.
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
  });

  it('advises reloading the page when the retry also fails', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'collectSVGs') {
        throw new Error('Could not establish connection. Receiving end does not exist.');
      }
      return { success: true };
    };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
    const empty = document.getElementById('empty-state');
    expect(empty.classList.contains('hidden')).toBe(false);
    expect(empty.querySelector('p').textContent).toBe(
      'Could not reach this page. Reload the page, then try again.'
    );
  });

  it('reports a generic failure when the content script answers without success', async () => {
    // The script was injected and replied — just not usefully. Not a connection
    // failure, so "reload the page" would be the wrong advice.
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'collectSVGs') return { success: false };
      return { success: true };
    };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error loading SVGs. Please try again.'
    );
  });

  it('does not retry non-connection errors', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'collectSVGs') throw new Error('boom');
      return { success: true };
    };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error loading SVGs. Please try again.'
    );
  });
});

// The content script counts what it could not extract (external sprite
// references, oversized SVGs, anything past the collection caps) and flags a
// bailed-out CSS-background scan. Reporting none of that made the count look
// authoritative when it wasn't.
describe('popup.js — reporting what was skipped', () => {
  it('says nothing when nothing was skipped', () => {
    send('svgsCollected', { count: 3, skipped: 0, bgScanSkipped: false });
    expect(document.getElementById('status').classList.contains('hidden')).toBe(true);
  });

  it('reports skipped SVGs, pluralized', () => {
    send('svgsCollected', { count: 3, skipped: 2, bgScanSkipped: false });
    const status = document.getElementById('status');
    expect(status.classList.contains('hidden')).toBe(false);
    expect(status.textContent).toMatch(/Skipped 2 SVGs/);

    send('svgsCollected', { count: 3, skipped: 1, bgScanSkipped: false });
    expect(document.getElementById('status').textContent).toMatch(/Skipped 1 SVG\b/);
  });

  it('reports a bailed-out background scan in preference to the count', () => {
    send('svgsCollected', { count: 3, skipped: 4, bgScanSkipped: true });
    expect(document.getElementById('status').textContent).toMatch(
      /too large to scan CSS backgrounds/
    );
  });
});

// The popup receives runtime broadcasts from every content script in every tab.
// Existing tests all pass an empty sender, which takes the pass-through branch,
// so the filter itself was never exercised.
describe('popup.js — cross-tab message filtering', () => {
  it('ignores an elementSelected from a tab this popup did not scan', () => {
    selectFirst(3);
    const before = document.getElementById('pagerPos').textContent;

    runtimeListener(
      {
        action: 'elementSelected',
        data: { type: 'svg', content: VALID_SVG, currentIndex: 2, total: 9 },
      },
      { tab: { id: 999 } },
      () => {}
    );

    expect(document.getElementById('pagerPos').textContent).toBe(before);
  });

  it('accepts a message from the pinned tab', () => {
    selectFirst(3);

    runtimeListener(
      {
        action: 'elementSelected',
        data: { type: 'svg', content: VALID_SVG, currentIndex: 2, total: 3 },
      },
      { tab: { id: 1 } },
      () => {}
    );

    expect(document.getElementById('pagerPos').textContent).toBe('03 / 03');
  });
});

// Chrome hard-blocks injection on the Web Store and the other browsers' add-on
// galleries even though they are https, so executeScript throws "cannot be
// scripted" instead of failing gracefully. These are detected up front.
describe('popup.js — unscriptable pages', () => {
  const emptyText = () => document.getElementById('empty-state').querySelector('p').textContent;

  for (const host of [
    'chrome.google.com',
    'chromewebstore.google.com',
    'addons.mozilla.org',
    'microsoftedge.microsoft.com',
  ]) {
    it(`explains that ${host} cannot be read`, async () => {
      activeTab = { id: 1, url: `https://${host}/webstore/category/extensions` };

      document.getElementById('refreshBtn').click();
      await settle();

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(emptyText()).toBe(
        "This is a browser page the extension can't read. Open a regular website and try again."
      );
    });
  }

  it('does not treat an ordinary https site as restricted', async () => {
    activeTab = { id: 1, url: 'https://chrome.google.example.com/docs' };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
  });

  it('treats a URL it cannot parse as restricted', async () => {
    // Fail closed: an unparseable tab URL must not fall through to injection.
    activeTab = { id: 1, url: 'http://' };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    expect(emptyText()).toBe(
      "This is a browser page the extension can't read. Open a regular website and try again."
    );
  });

  it('explains that a non-http(s) page cannot be accessed', async () => {
    activeTab = { id: 1, url: 'chrome://extensions' };

    document.getElementById('refreshBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    expect(emptyText()).toBe('Cannot access SVGs on this page. Try opening a webpage first.');
  });
});

describe('popup.js — preview of remote SVGs', () => {
  it('drops a stale fetch that resolves after a newer selection', async () => {
    // Prev/Next outruns a slow remote fetch. Without the token guard the stale
    // response repaints the plate with the previously selected icon.
    let resolveSlow;
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'fetchSVG') {
        if (msg.url.includes('slow')) {
          return await new Promise((resolve) => {
            resolveSlow = () => resolve({ success: true, content: VALID_SVG });
          });
        }
        return { success: true, content: VALID_SVG.replace('r="4"', 'r="9"') };
      }
      return { success: true };
    };

    send('svgsCollected', { count: 2, skipped: 0 });
    send('elementSelected', {
      type: 'img',
      content: 'https://cdn.example/slow.svg',
      currentIndex: 0,
      total: 2,
    });
    await settle();
    send('elementSelected', {
      type: 'img',
      content: 'https://cdn.example/fast.svg',
      currentIndex: 1,
      total: 2,
    });
    await settle();

    const rendersAfterFast = URL.createObjectURL.mock.calls.length;
    resolveSlow();
    await settle();

    // The late response must not produce another render.
    expect(URL.createObjectURL.mock.calls.length).toBe(rendersAfterFast);
    expect(document.getElementById('pagerPos').textContent).toBe('02 / 02');
  });

  it('reports an unpreviewable SVG without wrecking the rest of the UI', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'fetchSVG') return { success: false, error: 'HTTP 403' };
      return { success: true };
    };

    send('svgsCollected', { count: 2, skipped: 0 });
    send('elementSelected', {
      type: 'img',
      content: 'https://cdn.example/x.svg',
      currentIndex: 0,
      total: 2,
    });
    await settle();

    expect(document.getElementById('preview').textContent).toBe('This SVG could not be previewed.');
    // Pager, counter and nav survive — this is not showError.
    expect(document.getElementById('pagerPos').textContent).toBe('01 / 02');
    expect(document.getElementById('counter').textContent).toBe('2 found');
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('nextBtn').disabled).toBe(false);
  });
});

describe('popup.js — bulk export guards', () => {
  it('ignores a second Download-all click while one batch is in flight', async () => {
    // The export takes many seconds on a large page; a second click used to
    // start a whole parallel batch against the same origin.
    let resolveList;
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return await new Promise((resolve) => {
          resolveList = () =>
            resolve({ success: true, svgs: [{ type: 'svg', content: VALID_SVG }] });
        });
      }
      return { success: true };
    };

    const btn = document.getElementById('downloadAllBtn');
    btn.click();
    await settle();
    // Re-enable so the click actually dispatches: this pins the re-entry guard,
    // not jsdom's disabled-button behaviour.
    btn.disabled = false;
    btn.click();
    await settle();

    resolveList();
    await settle();

    const listCalls = chrome.tabs.sendMessage.mock.calls.filter(
      ([, msg]) => msg.action === 'getAllSVGs'
    );
    expect(listCalls).toHaveLength(1);
    expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
  });

  it('never runs more than six SVG fetches at once', async () => {
    // Mapping straight to Promise.all opened one request per SVG — hundreds at
    // once on an icon-heavy page, which stalled the tab.
    let inFlight = 0;
    let highWater = 0;
    const svgs = Array.from({ length: 30 }, (_, i) => ({
      type: 'img',
      content: `https://cdn.example/${i}.svg`,
    }));

    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') return { success: true, svgs };
      if (msg.action === 'fetchSVG') {
        inFlight++;
        highWater = Math.max(highWater, inFlight);
        await Promise.resolve();
        await Promise.resolve();
        inFlight--;
        return { success: true, content: VALID_SVG };
      }
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    expect(highWater).toBe(6);
    expect(document.getElementById('status').textContent).toMatch(/Downloaded 30 SVGs/);
  });
});

describe('popup.js — navigation recovery', () => {
  it('re-injects and retries when Prev/Next hits a dropped connection', async () => {
    // Without this, navigation dead-ends on an error the user cannot clear.
    let navCalls = 0;
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'nextSVG') {
        navCalls++;
        if (navCalls === 1) {
          throw new Error('Could not establish connection. Receiving end does not exist.');
        }
        return { success: true };
      }
      return { success: true };
    };

    document.getElementById('nextBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    // Re-injection must reuse the pinned tab, never a fresh "active tab" query.
    expect(chrome.tabs.get).toHaveBeenCalledWith(1);
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(navCalls).toBe(2);
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
  });

  it('advises reloading when the re-inject also fails', async () => {
    sendMessageImpl = async () => {
      throw new Error('Could not establish connection. Receiving end does not exist.');
    };

    document.getElementById('prevBtn').click();
    await settle();

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Could not reach this page. Reload the page, then try again.'
    );
  });

  it('reports an unclassified navigation failure separately', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'nextSVG') throw new Error('boom');
      return { success: true };
    };

    document.getElementById('nextBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error navigating SVGs. Please try again.'
    );
  });
});

describe('popup.js — bulk export failures', () => {
  it('reports a ZIP failure when the list of SVGs cannot be fetched', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') throw new Error('boom');
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error creating ZIP file. Please try again.'
    );
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('does nothing at all when the page reports no SVGs', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') return { success: true, svgs: [] };
      return { success: true };
    };

    document.getElementById('downloadAllBtn').click();
    await settle();

    // No archive, and no error either — there is nothing to report.
    expect(chrome.downloads.download).not.toHaveBeenCalled();
    expect(document.getElementById('empty-state').classList.contains('hidden')).toBe(true);
  });

  it('reports a ZIP failure when archive generation throws', async () => {
    const RealJSZip = globalThis.JSZip;
    globalThis.JSZip = class extends RealJSZip {
      generateAsync() {
        return Promise.reject(new Error('out of memory'));
      }
    };
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return { success: true, svgs: [{ type: 'svg', content: VALID_SVG }] };
      }
      return { success: true };
    };

    try {
      document.getElementById('downloadAllBtn').click();
      await settle();
    } finally {
      globalThis.JSZip = RealJSZip;
    }

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error creating ZIP file. Please try again.'
    );
  });
});

describe('popup.js — single download failures', () => {
  it('names the cross-origin cause when the fetch fails', async () => {
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'fetchSVG') return { success: false, error: 'HTTP 403' };
      return { success: true };
    };

    send('svgsCollected', { count: 1, skipped: 0 });
    send('elementSelected', {
      type: 'img',
      content: 'https://cdn.example/x.svg',
      currentIndex: 0,
      total: 1,
    });
    await settle();
    document.getElementById('downloadBtn').click();
    await settle();

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'This SVG is hosted on another domain and could not be downloaded. Try opening the image in a new tab and saving it directly.'
    );
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('names the parse failure rather than a generic download error', async () => {
    send('svgsCollected', { count: 1, skipped: 0 });
    send('elementSelected', {
      type: 'svg',
      content: '<svg xmlns="http://www.w3.org/2000/svg"><circle</svg>',
      currentIndex: 0,
      total: 1,
    });
    await settle();
    document.getElementById('downloadBtn').click();
    await settle();

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'This SVG could not be parsed and was not downloaded.'
    );
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('names the parse failure for a remote SVG that fetches but will not parse', async () => {
    // The fetch succeeded, so the cross-origin message would be misleading here.
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'fetchSVG') {
        return { success: true, content: '<svg xmlns="http://www.w3.org/2000/svg"><circle</svg>' };
      }
      return { success: true };
    };

    send('svgsCollected', { count: 1, skipped: 0 });
    send('elementSelected', {
      type: 'img',
      content: 'https://cdn.example/broken.svg',
      currentIndex: 0,
      total: 1,
    });
    await settle();
    document.getElementById('downloadBtn').click();
    await settle();

    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'This SVG could not be parsed and was not downloaded.'
    );
    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });
});

// Default settings (chrome.storage.sync.get resolves {} in this file's harness).
// The non-default counterparts live in popup-settings.test.js, which needs a
// different startup and therefore a separate module load.
describe('popup.js — default settings applied at startup', () => {
  it('shows the colour-changer hand-off when showColorLink is on', () => {
    expect(document.getElementById('colorLink').classList.contains('hidden')).toBe(false);
  });
});
