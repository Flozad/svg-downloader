import { beforeEach, describe, expect, it } from 'vitest';
import {
  collect,
  evaluateContent,
  installChrome,
  loadAndCollect,
  selections,
  send,
} from './helpers/content-harness.js';

/** Inject without scanning, so "did evaluation stay silent?" is observable. */
async function inject(html) {
  document.body.innerHTML = html;
  delete window.__svgDownloaderInjected;
  const handle = installChrome();
  await evaluateContent();
  return handle;
}

describe('content.js injection guard', () => {
  beforeEach(() => {
    delete window.__svgDownloaderInjected;
    document.body.innerHTML = '';
  });

  it('is safe to evaluate twice and registers the listener exactly once', async () => {
    // One chrome mock across both evaluations, so "exactly once" is measured
    // the way the isolated world sees it: re-declaring the top-level bindings
    // throws, and a second listener would double-handle every popup message.
    const handle = installChrome();

    await expect(evaluateContent()).resolves.toBeUndefined();
    await expect(evaluateContent()).resolves.toBeUndefined();

    expect(handle.addListener).toHaveBeenCalledTimes(1);
  });

  it('does not scan on evaluation — the popup is the only initiator', async () => {
    const handle = await inject('<svg><circle></circle></svg>');

    // Injection alone must be silent. The popup follows every executeScript
    // with a collectSVGs message, so scanning here too doubled the work and
    // pushed elementSelected twice on every open.
    expect(handle.sendMessage).not.toHaveBeenCalled();

    collect(handle);
    expect(handle.sendMessage).toHaveBeenCalled();
    expect(handle.messages.filter((m) => m.action === 'svgsCollected')).toHaveLength(1);
  });
});

// After an extension reload the page keeps whatever flag the previous build
// set, while that build's message listener is orphaned. A bare boolean made
// re-injection bail and left the page permanently unreachable.
describe('content.js injection stamp survives an extension reload', () => {
  beforeEach(() => {
    delete window.__svgDownloaderInjected;
    document.body.innerHTML = '';
  });

  async function evaluateAs(version) {
    const handle = installChrome({ id: 'abcdefghijklmnop', version });
    await evaluateContent();
    return handle.addListener;
  }

  it('re-initializes when the stamp changes', async () => {
    await evaluateAs('1.3');
    const afterReload = await evaluateAs('1.4');
    expect(afterReload).toHaveBeenCalledTimes(1);
  });

  it('still bails when the same build is injected twice', async () => {
    await evaluateAs('1.3');
    const second = await evaluateAs('1.3');
    expect(second).not.toHaveBeenCalled();
  });
});

// The popup drives navigation blindly — it fires nextSVG on every click without
// knowing where the cursor is. An unclamped index would walk off the end and
// leave sendCurrentSVG silently doing nothing (or worse, index into undefined).
describe('content.js next/previous navigation', () => {
  const THREE = '<svg><circle r="1"/></svg><svg><circle r="2"/></svg><svg><circle r="3"/></svg>';

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('advances one step at a time and answers success', async () => {
    const handle = await loadAndCollect(THREE);
    expect(selections(handle).at(-1).currentIndex).toBe(0);

    expect(send(handle, { action: 'nextSVG' }).response).toEqual({ success: true });
    expect(selections(handle).at(-1).currentIndex).toBe(1);
  });

  it('clamps at the last item instead of running off the end', async () => {
    const handle = await loadAndCollect(THREE);
    for (let i = 0; i < 5; i++) {
      expect(send(handle, { action: 'nextSVG' }).response).toEqual({ success: true });
    }

    expect(selections(handle).at(-1).currentIndex).toBe(2);
    // Initial collect + the two real advances. The three clamped calls must not
    // re-push a selection the popup would render as a fresh navigation.
    expect(selections(handle)).toHaveLength(3);
  });

  it('clamps at 0 instead of retreating below the first item', async () => {
    const handle = await loadAndCollect(THREE);
    for (let i = 0; i < 5; i++) {
      send(handle, { action: 'previousSVG' });
    }

    expect(selections(handle)).toHaveLength(1);
    expect(selections(handle).at(-1).currentIndex).toBe(0);

    send(handle, { action: 'nextSVG' });
    expect(selections(handle).at(-1).currentIndex).toBe(1);
    expect(send(handle, { action: 'previousSVG' }).response).toEqual({ success: true });
    expect(selections(handle).at(-1).currentIndex).toBe(0);
  });

  it('answers success even with nothing collected', async () => {
    const handle = await loadAndCollect('');
    expect(send(handle, { action: 'nextSVG' }).response).toEqual({ success: true });
    expect(send(handle, { action: 'previousSVG' }).response).toEqual({ success: true });
    expect(selections(handle)).toHaveLength(0);
  });
});
