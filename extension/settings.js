// Shared settings for the popup and the options page. Backed by
// chrome.storage.sync so a user's preferences follow them across machines.
// Every consumer reads through getSettings() so a missing key always resolves
// to the documented default rather than undefined.

import { sanitizeNamePart } from './svg-utils.js';

export const DEFAULT_SETTINGS = {
  filenamePrefix: 'svg', // single files and ZIP members fall back to `${prefix}-${n}`
  zipName: 'all-svgs', // archive name for "Download all as ZIP" (.zip appended)
  autoScan: true, // scan the page the moment the popup opens
  showColorLink: true, // show the hand-off to the SVG Color Changer
};

// Names are sanitized on write (options.js), but also on read: a value stored
// by an older build predates that check, and these strings reach
// chrome.downloads and ZIP entry names directly.
const NAME_FIELDS = ['filenamePrefix', 'zipName'];

function withSafeNames(settings) {
  const safe = { ...settings };
  for (const field of NAME_FIELDS) {
    safe[field] = sanitizeNamePart(safe[field]) || DEFAULT_SETTINGS[field];
  }
  return safe;
}

export async function getSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return withSafeNames({ ...DEFAULT_SETTINGS, ...stored });
  } catch (error) {
    console.error('Failed to read settings, using defaults:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch) {
  await chrome.storage.sync.set(patch);
}

export async function resetSettings() {
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS });
}
