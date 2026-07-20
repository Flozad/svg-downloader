import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '../extension/content.js'), 'utf8');

describe('content.js injection guard', () => {
  beforeEach(() => {
    delete window.__svgDownloaderInjected;
    delete window.__svgDownloaderCollect;
    document.body.innerHTML = '';
  });

  it('is safe to evaluate twice and registers the listener exactly once', () => {
    const addListener = vi.fn();
    globalThis.chrome = {
      runtime: {
        onMessage: { addListener },
        sendMessage: vi.fn(),
        lastError: null,
      },
    };

    expect(() => new Function(src)()).not.toThrow();
    expect(() => new Function(src)()).not.toThrow();

    expect(addListener).toHaveBeenCalledTimes(1);
  });

  it('exposes __svgDownloaderCollect after the first evaluation', () => {
    globalThis.chrome = {
      runtime: {
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(),
        lastError: null,
      },
    };

    new Function(src)();

    expect(typeof window.__svgDownloaderCollect).toBe('function');
  });
});
