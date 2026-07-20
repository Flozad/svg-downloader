import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadContent } from './helpers/content-harness.js';

async function setup(fetchImpl) {
  const handle = await loadContent({ html: '', fetch: fetchImpl });
  return handle.listener;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('content.js fetchSVG handler', () => {
  beforeEach(() => {
    delete globalThis.fetch;
  });

  it('fetches an https URL and returns its text', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg></svg>',
    }));
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    const ret = listener(
      { action: 'fetchSVG', url: 'https://cdn.example/a.svg' },
      {},
      sendResponse
    );
    expect(ret).toBe(true);
    await flush();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.example/a.svg',
      expect.objectContaining({ credentials: 'omit' })
    );
    expect(sendResponse).toHaveBeenCalledWith({ success: true, content: '<svg></svg>' });
  });

  it('fetches a data: URL', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => '<svg/>',
    }));
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'data:image/svg+xml,<svg/>' }, {}, sendResponse);
    await flush();

    expect(fetchMock).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true, content: '<svg/>' });
  });

  it('rejects a file: URL without ever calling fetch', async () => {
    const fetchMock = vi.fn();
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'file:///etc/passwd' }, {}, sendResponse);
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Unsupported URL scheme' });
  });

  it('reports a non-ok response as a failure', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 403,
      headers: { get: () => null },
      text: async () => '',
    }));
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/x.svg' }, {}, sendResponse);
    await flush();

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'HTTP 403' });
  });
});

describe('content.js fetchSVG bounds', () => {
  it('rejects a response whose declared length exceeds the cap', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: (h) => (h === 'content-length' ? '99000000' : null) },
      text: async () => 'x',
    }));
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/big.svg' }, {}, sendResponse);
    await flush();

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'SVG too large' });
  });

  it('stops reading a chunked body once it passes the cap', async () => {
    // No content-length, so the only defence is the incremental read. A
    // response.text() implementation would buffer all of this first.
    const chunk = new Uint8Array(1_000_000);
    let served = 0;
    const cancel = vi.fn(async () => {});
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: {
        getReader: () => ({
          read: async () => {
            served++;
            return served > 10 ? { done: true } : { done: false, value: chunk };
          },
          cancel,
        }),
      },
    }));
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/stream.svg' }, {}, sendResponse);
    await flush();
    await flush();

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'SVG too large' });
    // Bailed early rather than draining the whole stream.
    expect(served).toBeLessThan(10);
    expect(cancel).toHaveBeenCalled();
  });
});

// A stalled or never-closing response would otherwise leave the popup spinning
// forever with no recoverable error — the byte caps do nothing when no bytes
// ever arrive.
describe('content.js fetchSVG timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** A fetch that never settles until its AbortSignal fires. */
  function stalledFetch() {
    return vi.fn(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('The user aborted a request.');
            error.name = 'AbortError';
            reject(error);
          });
        })
    );
  }

  it('aborts after FETCH_TIMEOUT_MS and reports "Timed out"', async () => {
    const listener = await setup(stalledFetch());
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/stall.svg' }, {}, sendResponse);

    await vi.advanceTimersByTimeAsync(9999);
    expect(sendResponse).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2);
    // 'Timed out', not the raw AbortError message — the popup shows this string.
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'Timed out' });
  });

  it('does not abort a response that arrives in time', async () => {
    const abortSpy = vi.fn();
    const fetchMock = vi.fn(async (_url, { signal }) => {
      signal.addEventListener('abort', abortSpy);
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => '<svg/>',
      };
    });
    const listener = await setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/fast.svg' }, {}, sendResponse);
    await vi.advanceTimersByTimeAsync(0);
    expect(sendResponse).toHaveBeenCalledWith({ success: true, content: '<svg/>' });

    // The timer must be cleared on success, or every completed fetch leaves a
    // pending abort behind.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(abortSpy).not.toHaveBeenCalled();
  });
});
