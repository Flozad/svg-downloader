import { DEFAULT_SETTINGS, getSettings, saveSettings, resetSettings } from './settings.js';

const TEXT_FIELDS = ['filenamePrefix', 'zipName'];
const SWITCHES = ['autoScan', 'showColorLink'];

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const savedFlag = document.getElementById('savedFlag');
  const resetBtn = document.getElementById('resetBtn');

  function paint(settings) {
    for (const id of TEXT_FIELDS) {
      document.getElementById(id).value = settings[id] ?? '';
    }
    for (const id of SWITCHES) {
      document.getElementById(id).setAttribute('aria-checked', String(Boolean(settings[id])));
    }
  }

  function readForm() {
    const patch = {};
    for (const id of TEXT_FIELDS) {
      // Fall back to the default when the user clears the field, so downloads
      // are never named with an empty prefix.
      const value = document.getElementById(id).value.trim();
      patch[id] = value || DEFAULT_SETTINGS[id];
    }
    for (const id of SWITCHES) {
      patch[id] = document.getElementById(id).getAttribute('aria-checked') === 'true';
    }
    return patch;
  }

  let flagTimer = null;
  function flashSaved() {
    savedFlag.hidden = false;
    // reflow so the transition runs even on a rapid second save
    void savedFlag.offsetWidth;
    savedFlag.classList.add('show');
    clearTimeout(flagTimer);
    flagTimer = setTimeout(() => savedFlag.classList.remove('show'), 1800);
  }

  paint(await getSettings());

  // Switches toggle in place; changes commit on Save.
  for (const id of SWITCHES) {
    const el = document.getElementById(id);
    el.addEventListener('click', () => {
      el.setAttribute('aria-checked', el.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const patch = readForm();
    await saveSettings(patch);
    paint(patch); // reflect any default fallbacks back into the fields
    flashSaved();
  });

  resetBtn.addEventListener('click', async () => {
    await resetSettings();
    paint({ ...DEFAULT_SETTINGS });
    flashSaved();
  });
});
