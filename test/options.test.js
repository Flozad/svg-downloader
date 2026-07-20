import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../extension/settings.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const settle = async () => {
  await flush();
  await flush();
  await flush();
};

// What chrome.storage.sync holds at first paint.
const STORED = {
  filenamePrefix: 'icons',
  zipName: 'bundle',
  autoScan: false,
  showColorLink: true,
};

const $ = (id) => document.getElementById(id);
const checked = (id) => $(id).getAttribute('aria-checked');

function save() {
  $('settingsForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return settle();
}

beforeAll(async () => {
  // Real options DOM, scripts stripped, so element ids never drift from source.
  const html = fs.readFileSync(path.join(here, '../extension/options.html'), 'utf8');
  const body = html
    .slice(html.indexOf('<body'), html.indexOf('</body>'))
    .replace(/<script[\s\S]*?<\/script>/g, '');
  document.body.innerHTML = body.slice(body.indexOf('>') + 1);

  globalThis.chrome = {
    storage: {
      sync: {
        get: vi.fn(async () => ({ ...STORED })),
        set: vi.fn(async () => {}),
      },
    },
  };

  // Import once — options.js registers its DOMContentLoaded listener at module
  // scope; re-importing would stack listeners on the shared jsdom document.
  await import('../extension/options.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await settle();
});

describe('options.js — initial paint', () => {
  it('fills both text fields from stored settings', () => {
    expect($('filenamePrefix').value).toBe('icons');
    expect($('zipName').value).toBe('bundle');
  });

  it('paints each switch from its stored value, not the markup default', () => {
    // Both switches ship with aria-checked="true" in options.html, so a paint
    // that silently no-ops would still look correct for `showColorLink`.
    expect(checked('autoScan')).toBe('false');
    expect(checked('showColorLink')).toBe('true');
  });
});

describe('options.js — switches', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    $('resetBtn').click();
    await settle();
  });

  it('toggles aria-checked on click', () => {
    $('autoScan').click();
    expect(checked('autoScan')).toBe('false');
    $('autoScan').click();
    expect(checked('autoScan')).toBe('true');
  });

  it('toggles the switch when its label is clicked', () => {
    // `<button>` is a labelable element, so `<label for>` forwards the click
    // natively. options.js used to add its own label handler on the opposite
    // premise, which ran the toggle twice and left aria-checked where it
    // started — the label looked clickable and silently wasn't. A second
    // handler coming back would flip this straight back to a no-op.
    const before = checked('showColorLink');
    $('showColorLinkLabel').click();

    expect(checked('showColorLink')).not.toBe(before);
  });

  it('persists switch state on save', () => {
    $('autoScan').click();
    return save().then(() => {
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ autoScan: false, showColorLink: true })
      );
    });
  });
});

describe('options.js — saving names', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    $('resetBtn').click();
    await settle();
    vi.clearAllMocks();
  });

  it('stores the current field values', async () => {
    $('filenamePrefix').value = 'logo';
    $('zipName').value = 'assets';
    await save();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({ filenamePrefix: 'logo', zipName: 'assets' })
    );
  });

  it('never stores a traversal path', async () => {
    // These names reach chrome.downloads and ZIP entry names without passing
    // through sanitizeFilename. `../../evil` stored verbatim would write
    // outside the download directory.
    $('filenamePrefix').value = '../../evil';
    $('zipName').value = '../../../etc/passwd';
    await save();

    const patch = chrome.storage.sync.set.mock.calls[0][0];
    for (const value of [patch.filenamePrefix, patch.zipName]) {
      expect(value).not.toContain('..');
      expect(value).not.toContain('/');
      expect(value).not.toContain('\\');
    }
  });

  it('falls back to the default when a field is cleared, and repaints it', async () => {
    // An empty prefix would name downloads `-1.svg`. The fallback also has to
    // land back in the field, or the UI shows blank while storage says `svg`.
    $('filenamePrefix').value = '';
    $('zipName').value = '   ';
    await save();

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(
      expect.objectContaining({
        filenamePrefix: DEFAULT_SETTINGS.filenamePrefix,
        zipName: DEFAULT_SETTINGS.zipName,
      })
    );
    expect($('filenamePrefix').value).toBe(DEFAULT_SETTINGS.filenamePrefix);
    expect($('zipName').value).toBe(DEFAULT_SETTINGS.zipName);
  });

  it('shows the saved flag', async () => {
    await save();
    expect($('savedFlag').hidden).toBe(false);
    expect($('savedFlag').classList.contains('show')).toBe(true);
  });
});

describe('options.js — reset', () => {
  it('writes the defaults and repaints every control', async () => {
    $('filenamePrefix').value = 'logo';
    $('zipName').value = 'assets';
    $('autoScan').setAttribute('aria-checked', 'false');
    $('showColorLink').setAttribute('aria-checked', 'false');
    vi.clearAllMocks();

    $('resetBtn').click();
    await settle();

    expect(chrome.storage.sync.set).toHaveBeenCalledWith(DEFAULT_SETTINGS);
    expect($('filenamePrefix').value).toBe(DEFAULT_SETTINGS.filenamePrefix);
    expect($('zipName').value).toBe(DEFAULT_SETTINGS.zipName);
    expect(checked('autoScan')).toBe('true');
    expect(checked('showColorLink')).toBe('true');
    expect($('savedFlag').hidden).toBe(false);
  });
});
