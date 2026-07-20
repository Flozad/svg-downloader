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

beforeAll(async () => {
  // Real popup DOM, scripts stripped, so element ids never drift from source.
  const html = fs.readFileSync(path.join(here, '../extension/popup.html'), 'utf8');
  const body = html
    .slice(html.indexOf('<body'), html.indexOf('</body>'))
    .replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body.slice(body.indexOf('>') + 1);

  globalThis.chrome = {
    storage: { sync: { get: vi.fn(async () => ({})) } },
    tabs: {
      query: vi.fn(async () => [{ id: 1, url: 'https://example.com/' }]),
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
    downloads: { download: vi.fn(async () => 1) },
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
    sendMessageImpl = async (tabId, msg) => {
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
    sendMessageImpl = async (tabId, msg) => {
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
    sendMessageImpl = async (tabId, msg) => {
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
    sendMessageImpl = async (tabId, msg) => {
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
    sendMessageImpl = async (tabId, msg) => {
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

  it('does not retry non-connection errors', async () => {
    sendMessageImpl = async (tabId, msg) => {
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
