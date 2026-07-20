import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../extension/content.js'), 'utf8');

function setup(fetchImpl) {
  delete window.__svgDownloaderInjected;
  delete window.__svgDownloaderCollect;
  document.body.innerHTML = '';

  let listener = null;
  globalThis.chrome = {
    runtime: {
      onMessage: {
        addListener: (fn) => {
          listener = fn;
        },
      },
      sendMessage: () => {},
      lastError: null,
    },
  };
  globalThis.fetch = fetchImpl;

  new Function(src)();
  return listener;
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
      text: async () => '<svg></svg>',
    }));
    const listener = setup(fetchMock);
    const sendResponse = vi.fn();

    const ret = listener(
      { action: 'fetchSVG', url: 'https://cdn.example/a.svg' },
      {},
      sendResponse
    );
    expect(ret).toBe(true);
    await flush();

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example/a.svg');
    expect(sendResponse).toHaveBeenCalledWith({ success: true, content: '<svg></svg>' });
  });

  it('fetches a data: URL', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '<svg/>',
    }));
    const listener = setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'data:image/svg+xml,<svg/>' }, {}, sendResponse);
    await flush();

    expect(fetchMock).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true, content: '<svg/>' });
  });

  it('rejects a file: URL without ever calling fetch', async () => {
    const fetchMock = vi.fn();
    const listener = setup(fetchMock);
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
      text: async () => '',
    }));
    const listener = setup(fetchMock);
    const sendResponse = vi.fn();

    listener({ action: 'fetchSVG', url: 'https://cdn.example/x.svg' }, {}, sendResponse);
    await flush();

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'HTTP 403' });
  });
});
