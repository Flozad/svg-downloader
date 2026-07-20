import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// downloadBlob's whole job is deciding *when* an object URL may be revoked.
// Every branch of that decision was previously unexercised, and two shipped
// bugs live in it (see the individual tests). Fake timers throughout so the
// 60s backstop never fires by accident and so the one test that needs it can
// drive it exactly; nothing else in the download path uses setTimeout.

const here = path.dirname(fileURLToPath(import.meta.url));
const settle = async () => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};

const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>';
const DOWNLOAD_ID = 7;

let runtimeListener = null;
let downloadImpl = null;
let searchImpl = null;
const downloadListeners = new Set();
let objUrlSeq = 0;

// Fire an onChanged delta at whatever listeners downloadBlob has registered.
function fire(delta) {
  for (const fn of [...downloadListeners]) fn(delta);
}

function revokeCount(url) {
  return URL.revokeObjectURL.mock.calls.filter(([u]) => u === url).length;
}

beforeAll(async () => {
  vi.useFakeTimers();

  const html = fs.readFileSync(path.join(here, '../extension/popup.html'), 'utf8');
  const body = html
    .slice(html.indexOf('<body'), html.indexOf('</body>'))
    .replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body.slice(body.indexOf('>') + 1);

  globalThis.chrome = {
    storage: { sync: { get: vi.fn(async () => ({})) } },
    tabs: {
      query: vi.fn(async () => [{ id: 1, url: 'https://example.com/' }]),
      get: vi.fn(async (id) => ({ id, url: 'https://example.com/' })),
      sendMessage: vi.fn(async () => ({ success: true })),
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
      download: vi.fn((opts) => downloadImpl(opts)),
      search: vi.fn((query) => searchImpl(query)),
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
  // Unique URLs per blob so a download's URL can be told apart from the
  // preview's — asserting on a shared 'blob:fake' would prove nothing.
  globalThis.URL.createObjectURL = vi.fn(() => `blob:u${++objUrlSeq}`);
  globalThis.URL.revokeObjectURL = vi.fn();

  await import('../extension/popup.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await settle();
});

beforeEach(() => {
  vi.clearAllMocks();
  downloadListeners.clear();
  downloadImpl = async () => DOWNLOAD_ID;
  searchImpl = async () => [{ id: DOWNLOAD_ID, state: 'in_progress' }];
  chrome.tabs.sendMessage.mockImplementation(async () => ({ success: true }));
  for (const id of ['refreshBtn', 'downloadBtn', 'downloadAllBtn', 'prevBtn', 'nextBtn']) {
    document.getElementById(id).disabled = false;
  }
  document.getElementById('filenameInput').value = '';
  document.getElementById('empty-state').classList.add('hidden');
});

// Drive the real single-download path and hand back the object URL that
// downloadBlob actually passed to chrome.downloads.download.
async function startDownload() {
  runtimeListener({ action: 'svgsCollected', data: { count: 1, skipped: 0 } }, {}, () => {});
  runtimeListener(
    {
      action: 'elementSelected',
      data: { type: 'svg', content: VALID_SVG, currentIndex: 0, total: 1 },
    },
    {},
    () => {}
  );
  document.getElementById('downloadBtn').click();
  await settle();
  return chrome.downloads.download.mock.calls.at(-1)[0].url;
}

describe('downloadBlob — object URL lifetime', () => {
  it('does not revoke when chrome.downloads.download resolves', async () => {
    // download() resolves when the transfer is *initiated*, not when the blob
    // has been read. Revoking in a `finally` here truncated large ZIPs.
    const url = await startDownload();
    expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
    expect(revokeCount(url)).toBe(0);
  });

  it('revokes once the download reports complete', async () => {
    const url = await startDownload();
    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(1);
  });

  it('keeps the URL alive for a resumable interruption', async () => {
    // Chrome auto-retries some network interrupts. Revoking on `interrupted`
    // made downloads.resume fetch a dead blob: URL, losing the file for good.
    const url = await startDownload();
    fire({
      id: DOWNLOAD_ID,
      state: { current: 'interrupted' },
      canResume: { current: true },
    });
    expect(revokeCount(url)).toBe(0);

    // …and it is still usable when the resumed download finishes.
    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(1);
  });

  it('revokes on an interruption that cannot be resumed', async () => {
    const url = await startDownload();
    fire({
      id: DOWNLOAD_ID,
      state: { current: 'interrupted' },
      canResume: { current: false },
    });
    expect(revokeCount(url)).toBe(1);
  });

  it('ignores onChanged events for a different download and state-less deltas', async () => {
    // The popup can have several downloads outstanding; another one completing
    // must not pull this one's blob out from under it.
    const url = await startDownload();
    fire({ id: DOWNLOAD_ID + 1, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(0);

    // A filename-only delta carries no `state` at all.
    fire({ id: DOWNLOAD_ID, filename: { current: 'x.svg' } });
    expect(revokeCount(url)).toBe(0);

    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(1);
  });

  it('revokes via the search fallback when onChanged never fires', async () => {
    // A small download can reach `complete` before the listener is registered,
    // so no onChanged event ever arrives for it — without the one-shot search
    // the blob would be held until the backstop timer.
    searchImpl = async () => [{ id: DOWNLOAD_ID, state: 'complete' }];
    const url = await startDownload();
    expect(chrome.downloads.search).toHaveBeenCalledWith({ id: DOWNLOAD_ID });
    expect(revokeCount(url)).toBe(1);
  });

  it('revokes exactly once when onChanged and the search both report complete', async () => {
    let resolveSearch;
    searchImpl = () =>
      new Promise((resolve) => {
        resolveSearch = resolve;
      });

    const url = await startDownload();
    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(1);

    resolveSearch([{ id: DOWNLOAD_ID, state: 'complete' }]);
    await settle();
    expect(revokeCount(url)).toBe(1);
  });

  it('removes its onChanged listener on release', async () => {
    // The popup lives for many downloads; a listener per download would leak.
    await startDownload();
    expect(downloadListeners.size).toBe(1);
    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(downloadListeners.size).toBe(0);
  });

  it('releases a download left paused indefinitely after the 60s backstop', async () => {
    const url = await startDownload();
    fire({
      id: DOWNLOAD_ID,
      state: { current: 'interrupted' },
      canResume: { current: true },
    });

    await vi.advanceTimersByTimeAsync(59_000);
    expect(revokeCount(url)).toBe(0);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(revokeCount(url)).toBe(1);
    expect(downloadListeners.size).toBe(0);
  });

  it('does not keep a timer alive after a normal completion', async () => {
    // clearTimeout in release(): otherwise the backstop would fire on an
    // already-revoked URL 60s later.
    await startDownload();
    expect(vi.getTimerCount()).toBe(1);
    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('revokes immediately and propagates when download() rejects', async () => {
    downloadImpl = async () => {
      throw new Error('Download failed');
    };

    const url = await startDownload();
    expect(revokeCount(url)).toBe(1);
    expect(downloadListeners.size).toBe(0);
    // The rejection must reach downloadSVG rather than being swallowed.
    expect(document.getElementById('empty-state').querySelector('p').textContent).toBe(
      'Error downloading SVG. Please try again.'
    );
  });

  it('holds the ZIP blob until the archive download completes', async () => {
    // The truncation bug was reported against multi-MB ZIPs specifically, so
    // pin the bulk path too and not just the single-file one.
    chrome.tabs.sendMessage.mockImplementation(async (_tabId, msg) => {
      if (msg.action === 'getAllSVGs') {
        return { success: true, svgs: [{ type: 'svg', content: VALID_SVG }] };
      }
      return { success: true };
    });

    document.getElementById('downloadAllBtn').click();
    await settle();

    const url = chrome.downloads.download.mock.calls.at(-1)[0].url;
    expect(chrome.downloads.download).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'all-svgs.zip' })
    );
    expect(revokeCount(url)).toBe(0);

    fire({ id: DOWNLOAD_ID, state: { current: 'complete' } });
    expect(revokeCount(url)).toBe(1);
  });
});
