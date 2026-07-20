import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// popup.js reads settings once, on DOMContentLoaded, and it can only be
// imported once per module registry (its listener is registered at module
// scope). popup.test.js owns the default-settings startup; this file owns the
// non-default one, which is why it is a separate file rather than a describe.

const here = path.dirname(fileURLToPath(import.meta.url));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  await flush();
  await flush();
  await flush();
};

const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>';

const STORED_SETTINGS = {
  filenamePrefix: 'icon',
  zipName: 'my-icons',
  autoScan: false,
  showColorLink: false,
};

let runtimeListener = null;
let sendMessageImpl = async () => ({ success: true });
const zipInstances = [];

beforeAll(async () => {
  const html = fs.readFileSync(path.join(here, '../extension/popup.html'), 'utf8');
  const body = html
    .slice(html.indexOf('<body'), html.indexOf('</body>'))
    .replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body.slice(body.indexOf('>') + 1);

  const downloadListeners = new Set();
  globalThis.chrome = {
    storage: { sync: { get: vi.fn(async () => ({ ...STORED_SETTINGS })) } },
    tabs: {
      query: vi.fn(async () => [{ id: 1, url: 'https://example.com/' }]),
      get: vi.fn(async (id) => ({ id, url: 'https://example.com/' })),
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
    downloads: {
      download: vi.fn(async () => {
        queueMicrotask(() => {
          for (const fn of downloadListeners) fn({ id: 1, state: { current: 'complete' } });
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
      zipInstances.push(this);
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

  await import('../extension/popup.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await settle();
});

function send(action, data) {
  runtimeListener({ action, data }, {}, () => {});
}

// These run in order: the first case asserts on the untouched startup state, so
// nothing may clear the mocks before it.
describe('popup.js — autoScan off', () => {
  it('does not scan on open and offers the idle prompt instead', () => {
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();

    const empty = document.getElementById('empty-state');
    expect(empty.classList.contains('hidden')).toBe(false);
    expect(empty.querySelector('p').textContent).toBe('Ready when you are');
    expect(document.getElementById('retryBtn').querySelector('span').textContent).toBe(
      'Scan this page'
    );
    // No spinner — this is an idle state, not a pending one.
    expect(document.getElementById('loading').classList.contains('hidden')).toBe(true);
    for (const id of ['prevBtn', 'nextBtn', 'downloadBtn', 'downloadAllBtn']) {
      expect(document.getElementById(id).disabled).toBe(true);
    }
  });

  it('scans when the prompt is clicked and restores the default label', async () => {
    document.getElementById('retryBtn').click();
    await settle();

    expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['content.js'] })
    );
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'collectSVGs' });
    expect(document.getElementById('retryBtn').querySelector('span').textContent).toBe('Scan page');
  });
});

describe('popup.js — other preferences', () => {
  it('hides the colour-changer hand-off when showColorLink is off', () => {
    expect(document.getElementById('colorLink').classList.contains('hidden')).toBe(true);
  });

  it('opens the options page from the settings button', () => {
    document.getElementById('settingsBtn').click();
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('uses the stored filenamePrefix for the default single-file name', async () => {
    send('svgsCollected', { count: 1, skipped: 0 });
    send('elementSelected', { type: 'svg', content: VALID_SVG, currentIndex: 0, total: 1 });
    document.getElementById('filenameInput').value = '';
    document.getElementById('downloadBtn').click();
    await settle();

    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'icon-1.svg' })
    );
  });

  it('uses the stored zipName and prefix for the archive and its members', async () => {
    chrome.downloads.download.mockClear();
    sendMessageImpl = async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return { success: true, svgs: [{ type: 'svg', content: VALID_SVG }] };
      }
      return { success: true };
    };

    document.getElementById('downloadAllBtn').disabled = false;
    document.getElementById('downloadAllBtn').click();
    await settle();

    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'my-icons.zip' })
    );
    expect(Object.keys(zipInstances.at(-1).files)).toEqual(['icon-1.svg']);
  });
});
