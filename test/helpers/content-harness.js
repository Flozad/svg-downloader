import { vi } from 'vitest';

// content.js is a bare IIFE with no imports/exports, so importing it simply
// runs it. Loading it this way rather than `new Function(readFileSync(...))()`
// is what makes it visible to v8 coverage — the hand-rolled evaluation was
// faithful to executeScript re-injection but reported 0% for the largest file
// in the extension, hiding every real gap.
//
// vi.resetModules() drops it from the module cache so the next import
// re-evaluates the IIFE, which is exactly what a repeat executeScript does.
// A cache-busting query (`content.js?v=1`) is not an option — vite rejects it.
const CONTENT = '../../extension/content.js';

/**
 * Install the chrome mock content.js talks to. Returns the live handle whose
 * `listener` is filled in once the script registers it and whose `messages`
 * accumulates every chrome.runtime.sendMessage payload.
 */
export function installChrome({ id = 'abcdefghijklmnop', version = '0' } = {}) {
  const handle = {
    listener: null,
    messages: [],
    addListener: null,
    sendMessage: null,
  };

  handle.addListener = vi.fn((fn) => {
    handle.listener = fn;
  });
  handle.sendMessage = vi.fn((msg) => {
    handle.messages.push(msg);
  });

  globalThis.chrome = {
    runtime: {
      id,
      getManifest: () => ({ version }),
      onMessage: { addListener: handle.addListener },
      sendMessage: handle.sendMessage,
      lastError: null,
    },
  };

  return handle;
}

/** Re-evaluate content.js the way a fresh executeScript injection would. */
export async function evaluateContent() {
  vi.resetModules();
  await import(CONTENT);
}

/**
 * Inject content.js into the current document.
 *
 * `keepFlag: true` leaves window.__svgDownloaderInjected alone so the
 * injection-guard path can be exercised; every other caller wants a clean world.
 */
export async function loadContent({ html, fetch: fetchImpl, id, version, keepFlag = false } = {}) {
  if (html !== undefined) document.body.innerHTML = html;
  if (!keepFlag) delete window.__svgDownloaderInjected;

  const handle = installChrome({ id, version });
  if (fetchImpl !== undefined) globalThis.fetch = fetchImpl;

  await evaluateContent();
  return handle;
}

/**
 * Inject, then drive a scan the way the popup does. Evaluating the script no
 * longer scans on its own — the popup always follows executeScript with a
 * collectSVGs message, and doing both meant every open scanned twice.
 */
export async function loadAndCollect(html) {
  const handle = await loadContent({ html });
  collect(handle);
  return handle;
}

export function collect(handle) {
  handle.listener({ action: 'collectSVGs' }, {}, () => {});
}

/** The full markup list, requested the way the popup requests it at ZIP time. */
export function items(handle) {
  let svgs = [];
  handle.listener({ action: 'getAllSVGs' }, {}, (res) => {
    svgs = res.svgs;
  });
  return svgs;
}

function collected(handle) {
  return handle.messages.find((m) => m.action === 'svgsCollected');
}

export function count(handle) {
  return collected(handle)?.data.count ?? 0;
}

export function skipped(handle) {
  return collected(handle)?.data.skipped ?? 0;
}

export function bgScanSkipped(handle) {
  return collected(handle)?.data.bgScanSkipped ?? false;
}

/** Every elementSelected payload pushed so far, oldest first. */
export function selections(handle) {
  return handle.messages.filter((m) => m.action === 'elementSelected').map((m) => m.data);
}

/** Send a message and return the synchronous response the handler produced. */
export function send(handle, request) {
  let response;
  const ret = handle.listener(request, {}, (res) => {
    response = res;
  });
  return { response, ret };
}
