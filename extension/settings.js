// Shared settings for the popup and the options page. Backed by
// chrome.storage.sync so a user's preferences follow them across machines.
// Every consumer reads through getSettings() so a missing key always resolves
// to the documented default rather than undefined.

export const DEFAULT_SETTINGS = {
  filenamePrefix: 'svg', // single files and ZIP members fall back to `${prefix}-${n}`
  zipName: 'all-svgs',   // archive name for "Download all as ZIP" (.zip appended)
  autoScan: true,        // scan the page the moment the popup opens
  showColorLink: true,   // show the hand-off to the SVG Color Changer
};

export async function getSettings() {
  try {
    const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
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
