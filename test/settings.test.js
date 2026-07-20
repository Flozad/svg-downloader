import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SETTINGS,
  getSettings,
  resetSettings,
  saveSettings,
} from '../extension/settings.js';

// Storage answers are shaped per test; `get` resolves with whatever a build
// (current or older) left in chrome.storage.sync.
let getImpl = async () => ({});

beforeEach(() => {
  getImpl = async () => ({});
  globalThis.chrome = {
    storage: {
      sync: {
        get: vi.fn((...args) => getImpl(...args)),
        set: vi.fn(async () => {}),
      },
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getSettings', () => {
  it('returns the documented defaults when storage is empty', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('lets stored values override defaults', async () => {
    getImpl = async () => ({
      filenamePrefix: 'icons',
      zipName: 'bundle',
      autoScan: false,
      showColorLink: false,
    });
    expect(await getSettings()).toEqual({
      filenamePrefix: 'icons',
      zipName: 'bundle',
      autoScan: false,
      showColorLink: false,
    });
  });

  it('fills in keys storage never wrote', async () => {
    // A profile that predates a setting has no row for it. Consumers read the
    // value straight into UI state, so `undefined` would paint a switch off
    // rather than at its documented default.
    getImpl = async () => ({ filenamePrefix: 'icons' });
    const settings = await getSettings();
    expect(settings.autoScan).toBe(true);
    expect(settings.showColorLink).toBe(true);
    expect(settings.zipName).toBe('all-svgs');
  });

  it('scrubs a hostile name written by an older build', async () => {
    // Names are sanitized on write today, but a value stored before that check
    // existed reaches chrome.downloads and ZIP entry names verbatim. This is
    // the read-side guard: traversal must not survive, and a Windows device
    // name must fall back rather than produce an unwritable file.
    getImpl = async () => ({ filenamePrefix: '../../evil', zipName: 'con' });
    const settings = await getSettings();

    expect(settings.filenamePrefix).not.toContain('..');
    expect(settings.filenamePrefix).not.toContain('/');
    expect(settings.zipName).toBe(DEFAULT_SETTINGS.zipName);
  });

  it('falls back to defaults when storage rejects', async () => {
    // chrome.storage.sync throws on quota errors and in a torn-down context.
    // The popup opens against this call, so a rejection must not surface.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getImpl = async () => {
      throw new Error('QUOTA_BYTES quota exceeded');
    };

    await expect(getSettings()).resolves.toEqual(DEFAULT_SETTINGS);
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('saveSettings / resetSettings', () => {
  it('passes the patch straight through to storage', async () => {
    await saveSettings({ autoScan: false });
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ autoScan: false });
  });

  it('writes the full default set on reset', async () => {
    // A partial write would leave a stale key behind and "Reset to defaults"
    // would silently not reset it.
    await resetSettings();
    expect(chrome.storage.sync.set).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });
});
