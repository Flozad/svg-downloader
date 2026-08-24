import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyImage, copyText } from '../extension/clipboard.js';

const original = {
  clipboard: Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard'),
  ClipboardItem: globalThis.ClipboardItem,
};

function setClipboard(value) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value,
    configurable: true,
  });
}

afterEach(() => {
  if (original.clipboard) {
    Object.defineProperty(globalThis.navigator, 'clipboard', original.clipboard);
  } else {
    setClipboard(undefined);
  }
  globalThis.ClipboardItem = original.ClipboardItem;
});

describe('copyText', () => {
  it('writes text through the async clipboard API', async () => {
    const writeText = vi.fn(async () => {});
    setClipboard({ writeText });
    await copyText('<svg/>');
    expect(writeText).toHaveBeenCalledWith('<svg/>');
  });

  it('rejects when the clipboard is unavailable', async () => {
    setClipboard(undefined);
    await expect(copyText('x')).rejects.toThrow(/unavailable/);
  });
});

describe('copyImage', () => {
  it('writes a ClipboardItem carrying the blob under its own mime type', async () => {
    const write = vi.fn(async () => {});
    setClipboard({ write });
    globalThis.ClipboardItem = class {
      constructor(items) {
        this.items = items;
      }
    };
    const blob = new Blob(['x'], { type: 'image/png' });
    await copyImage(blob);

    expect(write).toHaveBeenCalledTimes(1);
    const [[items]] = write.mock.calls; // write([ClipboardItem])
    expect(items[0].items['image/png']).toBe(blob);
  });

  it('rejects when image copy is unsupported', async () => {
    setClipboard({});
    globalThis.ClipboardItem = undefined;
    await expect(copyImage(new Blob(['x'], { type: 'image/png' }))).rejects.toThrow(
      /not supported/
    );
  });
});
