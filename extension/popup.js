import { renderPreview } from './preview.js';
import { getSettings } from './settings.js';
import { formatSVGContent, sanitizeFilename } from './svg-utils.js';

let currentSVG = null;
let settings = null;

document.addEventListener('DOMContentLoaded', async () => {
  const preview = document.getElementById('preview');
  const noPreview = document.getElementById('no-preview');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('empty-state');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const counter = document.getElementById('counter');
  const refreshBtn = document.getElementById('refreshBtn');
  const retryBtn = document.getElementById('retryBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const colorLink = document.getElementById('colorLink');
  const pagerPos = document.getElementById('pagerPos');
  const mountTag = document.getElementById('mountTag');

  settings = await getSettings();

  // Apply preference-driven chrome before the first scan.
  colorLink.classList.toggle('hidden', !settings.showColorLink);
  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  function setCounter(count) {
    counter.textContent = `${count} found`;
    counter.classList.toggle('has', count > 0);
  }

  let previewObjectUrl = null;

  function setLoading(loading_state) {
    loading.classList.toggle('hidden', !loading_state);
    refreshBtn.disabled = loading_state;
    if (loading_state) {
      noPreview.classList.remove('hidden');
      preview.classList.add('hidden');
      emptyState.classList.add('hidden');
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      downloadBtn.disabled = true;
      downloadAllBtn.disabled = true;
    }
  }

  function showError(message) {
    setLoading(false);
    noPreview.classList.add('hidden');
    preview.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = message;
    // The idle prompt renames this button; an error arriving afterwards would
    // otherwise leave it reading "Scan this page" next to a failure message.
    retryBtn.querySelector('span').textContent = 'Scan page';
    setCounter(0);
    pagerPos.textContent = '—';
    mountTag.textContent = 'preview';
  }

  // Non-destructive status line for ZIP outcomes — unlike showError it leaves
  // the preview, counter and pager intact. Passing '' hides it.
  function showStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.classList.toggle('hidden', !message);
  }

  // Show the idle prompt used when auto-scan is off: no spinner, a "Scan page"
  // affordance in the empty state, controls disabled until the user scans.
  function showScanPrompt() {
    setLoading(false);
    noPreview.classList.add('hidden');
    preview.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p').textContent = 'Ready when you are';
    retryBtn.querySelector('span').textContent = 'Scan this page';
    setCounter(0);
    pagerPos.textContent = '—';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    downloadBtn.disabled = true;
    downloadAllBtn.disabled = true;
  }

  // Pages the browser refuses to let extensions script, even over https. The
  // Web Store and other browsers' add-on galleries throw "cannot be scripted"
  // from executeScript, so we detect them before attempting injection.
  function isRestrictedUrl(url) {
    let host;
    try {
      host = new URL(url).hostname;
    } catch {
      return true;
    }
    return (
      host === 'chrome.google.com' ||
      host === 'chromewebstore.google.com' ||
      host === 'addons.mozilla.org' ||
      host === 'microsoftedge.microsoft.com'
    );
  }

  // The tab this popup is bound to, captured at injection. Navigation and fetch
  // messages target it explicitly rather than re-resolving "active tab" on every
  // call — in a detached popup the active tab can change underneath us, which
  // would silently drive a different page's content script.
  let activeTabId = null;

  // `pinnedTabId` is passed on the recovery path. Without it, re-injection ran a
  // fresh "active tab" query and could rebind the popup to a *different* tab —
  // reintroducing the exact bug the pinning below exists to prevent.
  async function injectContentScript(pinnedTabId = null) {
    try {
      const tab =
        pinnedTabId === null
          ? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
          : await chrome.tabs.get(pinnedTabId);
      if (!tab) throw new Error('No active tab found');

      // Check if we can access the tab. Chrome allows only http(s) pages, and
      // even then hard-blocks injection on the Web Store / extensions gallery,
      // so treat those as unreachable up front with a clear message.
      if (!tab.url?.startsWith('http')) {
        throw new Error('Cannot access this page');
      }
      if (isRestrictedUrl(tab.url)) {
        throw new Error('Cannot access this page: restricted by the browser');
      }

      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });

      activeTabId = tab.id;
      return tab;
    } catch (error) {
      console.error('Error injecting content script:', error);
      throw error;
    }
  }

  // A dropped connection to the content script is recoverable: after the
  // extension is reloaded, already-open tabs can briefly be unreachable until
  // re-injection lands. Classify those so refreshSVGs can retry once.
  function isConnectionError(error) {
    const m = error?.message || '';
    return m.includes('Receiving end does not exist') || m.includes('message port closed');
  }

  async function injectAndCollect(pinnedTabId = null) {
    const tab = await injectContentScript(pinnedTabId);
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'collectSVGs' });
    if (!response?.success) {
      throw new Error('Failed to collect SVGs');
    }
  }

  async function refreshSVGs() {
    setLoading(true);
    showStatus('');
    preview.classList.add('hidden');
    emptyState.classList.add('hidden');
    noPreview.classList.remove('hidden');
    noPreview.textContent = 'Loading SVGs...';

    try {
      try {
        await injectAndCollect();
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        await injectAndCollect(); // one retry for connection-shaped failures
      }
    } catch (error) {
      console.error('Error refreshing SVGs:', error);
      if (error.message.includes('restricted') || error.message.includes('cannot be scripted')) {
        showError(
          "This is a browser page the extension can't read. Open a regular website and try again."
        );
      } else if (error.message.includes('Cannot access')) {
        showError('Cannot access SVGs on this page. Try opening a webpage first.');
      } else if (isConnectionError(error)) {
        showError('Could not reach this page. Reload the page, then try again.');
      } else {
        showError('Error loading SVGs. Please try again.');
      }
    }
  }

  // Refresh button handlers. Restore the default scan label in case the idle
  // prompt renamed it.
  function scan() {
    retryBtn.querySelector('span').textContent = 'Scan page';
    refreshSVGs();
  }
  refreshBtn.addEventListener('click', scan);
  retryBtn.addEventListener('click', scan);

  // Scan on open unless the user turned that off in settings.
  if (settings.autoScan) {
    refreshSVGs();
  } else {
    showScanPrompt();
  }

  // Handle navigation. If the page navigated out from under us the content
  // script is gone with it, and the retry that refreshSVGs already does for
  // connection-shaped failures applies here too — without it, Prev/Next dead-
  // ends on an error the user has no way to clear.
  async function sendTabMessage(action) {
    if (activeTabId === null) {
      showError('Could not reach this page. Reload the page, then try again.');
      return;
    }
    try {
      return await chrome.tabs.sendMessage(activeTabId, { action });
    } catch (error) {
      if (isConnectionError(error)) {
        try {
          await injectAndCollect(activeTabId);
          return await chrome.tabs.sendMessage(activeTabId, { action });
        } catch (retryError) {
          console.error(`Error sending ${action} message after re-inject:`, retryError);
          showError('Could not reach this page. Reload the page, then try again.');
          return;
        }
      }
      console.error(`Error sending ${action} message:`, error);
      showError('Error navigating SVGs. Please try again.');
    }
  }

  // Fetch a cross-origin SVG URL through the content script, which runs in the
  // page's own origin under activeTab — so no host permission is needed. Throws
  // on failure; callers turn the rejection into the right user-facing message.
  async function fetchSVGContent(url) {
    if (activeTabId === null) throw new Error('No active tab found');

    const response = await chrome.tabs.sendMessage(activeTabId, { action: 'fetchSVG', url });
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to fetch SVG');
    }
    return response.content;
  }

  // Render the current item into the preview plate. Inline markup goes straight
  // to a blob; a remote SVG is fetched to markup first so the popup never loads
  // a page-controlled URL from the extension origin (see preview.js). Previews
  // race — Prev/Next can outrun a slow fetch — so a stale response is dropped.
  let previewToken = 0;
  async function showPreview(svg) {
    const token = ++previewToken;

    if (svg.type === 'svg') {
      previewObjectUrl = renderPreview(preview, svg.content, previewObjectUrl);
      return;
    }

    try {
      const markup = await fetchSVGContent(svg.content);
      if (token !== previewToken) return;
      previewObjectUrl = renderPreview(preview, markup, previewObjectUrl);
    } catch (error) {
      if (token !== previewToken) return;
      console.error('Error loading SVG preview:', error);
      preview.textContent = 'This SVG could not be previewed.';
    }
  }

  // chrome.downloads.download resolves when the download is *initiated*, not
  // when the blob has been read. Revoking in a `finally` therefore raced the
  // transfer and truncated large ZIPs. Hold the object URL until the download
  // reaches a terminal state, with a timeout so a download the user leaves
  // paused indefinitely cannot leak the blob for the life of the popup.
  const REVOKE_TIMEOUT_MS = 60_000;

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    return chrome.downloads
      .download({ url, filename })
      .then((downloadId) => {
        let timer = null;
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          chrome.downloads.onChanged.removeListener(onChanged);
          clearTimeout(timer);
          URL.revokeObjectURL(url);
        };
        function onChanged(delta) {
          if (delta.id !== downloadId || !delta.state) return;
          // `complete` is the only truly terminal state. `interrupted` is
          // resumable — Chrome auto-retries some network interrupts — and
          // revoking there would make chrome.downloads.resume fetch a dead
          // blob: URL, losing the file for good.
          if (delta.state.current === 'complete') release();
          if (delta.state.current === 'interrupted' && delta.canResume?.current === false) {
            release();
          }
        }
        chrome.downloads.onChanged.addListener(onChanged);

        // A small download often reaches `complete` before the listener is
        // registered, in which case onChanged never fires for it. Ask once.
        chrome.downloads.search?.({ id: downloadId })?.then?.(([item]) => {
          if (item?.state === 'complete') release();
        });

        // Backstop only, for a download left paused indefinitely. It is
        // deliberately long: revoking under a paused-but-resumable download
        // would break the resume this function exists to protect.
        timer = setTimeout(release, REVOKE_TIMEOUT_MS);
      })
      .catch((error) => {
        URL.revokeObjectURL(url);
        throw error;
      });
  }

  prevBtn.addEventListener('click', () => sendTabMessage('previousSVG'));
  nextBtn.addEventListener('click', () => sendTabMessage('nextSVG'));

  // Handle single download
  downloadBtn.addEventListener('click', () => {
    if (!currentSVG) return;
    downloadSVG(currentSVG);
  });

  // Handle bulk download. Guarded against re-entry: the export can take many
  // seconds on a large page, and a second click used to start a whole parallel
  // batch against the same origin.
  let zipInProgress = false;
  downloadAllBtn.addEventListener('click', async () => {
    if (zipInProgress) return;
    zipInProgress = true;
    downloadAllBtn.disabled = true;
    try {
      await buildAndDownloadZip();
    } finally {
      zipInProgress = false;
      downloadAllBtn.disabled = false;
    }
  });

  async function buildAndDownloadZip() {
    // Ask the content script for the full list on demand — navigation messages
    // no longer carry it, so it isn't re-serialized on every Prev/Next click.
    let svgs;
    try {
      const response = await sendTabMessage('getAllSVGs');
      if (!response?.success) throw new Error('Failed to list SVGs');
      svgs = response.svgs;
    } catch (error) {
      console.error('Error listing SVGs:', error);
      showError('Error creating ZIP file. Please try again.');
      return;
    }
    if (!svgs || svgs.length === 0) return;

    try {
      const zip = new JSZip();
      const failures = [];

      async function addToZip(svg, index) {
        const filename = `${settings.filenamePrefix}-${index + 1}.svg`;
        try {
          let formattedContent;

          if (svg.type === 'svg') {
            formattedContent = await formatSVGContent(svg.content);
          } else {
            const svgContent = await fetchSVGContent(svg.content);
            formattedContent = await formatSVGContent(svgContent);
          }

          zip.file(filename, formattedContent);
        } catch (error) {
          console.error(`Error processing SVG ${index + 1}:`, error);
          failures.push(index + 1);
        }
      }

      // Bounded worker pool. Mapping straight to Promise.all opened one fetch
      // per SVG at once — on an icon-heavy page that is hundreds of concurrent
      // requests against the origin, which stalls the tab and fails items that
      // would have succeeded serially.
      const CONCURRENCY = 6;
      let cursor = 0;
      const worker = async () => {
        while (cursor < svgs.length) {
          const index = cursor++;
          await addToZip(svgs[index], index);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, svgs.length) }, () => worker()));

      if (failures.length === svgs.length) {
        showError('None of the SVGs on this page could be exported.');
        return;
      }

      // Generate and download the zip
      const blob = await zip.generateAsync({ type: 'blob' });
      await downloadBlob(blob, `${settings.zipName}.zip`);

      if (failures.length > 0) {
        showStatus(
          `Downloaded ${svgs.length - failures.length} of ${svgs.length} SVGs. Skipped: ${failures.join(', ')}.`
        );
      } else {
        showStatus(`Downloaded ${svgs.length} SVGs as ZIP.`);
      }
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showError('Error creating ZIP file. Please try again.');
    }
  }

  async function downloadSVG(svg) {
    const filenameInput = document.getElementById('filenameInput');
    const filename = sanitizeFilename(
      filenameInput.value,
      `${settings.filenamePrefix}-${svg.currentIndex + 1}`
    );

    let formattedContent;
    try {
      if (svg.type === 'svg') {
        formattedContent = await formatSVGContent(svg.content);
      } else {
        let svgContent;
        try {
          svgContent = await fetchSVGContent(svg.content);
        } catch (error) {
          console.error('Error fetching SVG:', error);
          showError(
            'This SVG is hosted on another domain and could not be downloaded. Try opening the image in a new tab and saving it directly.'
          );
          return;
        }
        formattedContent = await formatSVGContent(svgContent);
      }
    } catch (error) {
      console.error('Error preparing SVG:', error);
      if (error.message === 'Invalid SVG markup') {
        showError('This SVG could not be parsed and was not downloaded.');
      } else {
        showError('Error downloading SVG. Please try again.');
      }
      return;
    }

    const blob = new Blob([formattedContent], { type: 'image/svg+xml;charset=utf-8' });
    try {
      await downloadBlob(blob, filename);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      showError('Error downloading SVG. Please try again.');
    }
  }

  // Handle messages from content script. The popup receives broadcasts from
  // every content script in every tab, so ignore anything that isn't the tab
  // this popup scanned — otherwise a stale injection elsewhere can overwrite
  // the current selection and the pager readout.
  chrome.runtime.onMessage.addListener((request, sender) => {
    if (activeTabId !== null && sender?.tab?.id !== undefined && sender.tab.id !== activeTabId) {
      return;
    }
    switch (request.action) {
      case 'svgsCollected': {
        const { count, skipped, bgScanSkipped } = request.data;
        setCounter(count);
        setLoading(false);

        // Say what was missed. The content script skips external sprite
        // references, oversized SVGs and anything past the collection caps, and
        // bails out of the CSS-background scan entirely on very large pages.
        // Reporting zero of that made the count look authoritative when it
        // wasn't.
        if (bgScanSkipped) {
          showStatus('This page is too large to scan CSS backgrounds — other SVGs still found.');
        } else if (skipped > 0) {
          const noun = skipped === 1 ? 'SVG' : 'SVGs';
          showStatus(`Skipped ${skipped} ${noun} that can't be extracted standalone.`);
        }

        if (count === 0) {
          noPreview.classList.add('hidden');
          emptyState.classList.remove('hidden');
          emptyState.querySelector('p').textContent = 'No SVGs found on this page';
          pagerPos.textContent = '—';
          mountTag.textContent = 'preview';
          prevBtn.disabled = true;
          nextBtn.disabled = true;
          downloadBtn.disabled = true;
          downloadAllBtn.disabled = true;
        }
        break;
      }

      case 'elementSelected': {
        currentSVG = request.data;

        // Update preview
        noPreview.classList.add('hidden');
        emptyState.classList.add('hidden');
        preview.classList.remove('hidden');

        showPreview(currentSVG);

        // Position readout: 03 / 24, with the mount tag tracking the same index.
        const pos = String(currentSVG.currentIndex + 1).padStart(2, '0');
        const total = String(currentSVG.total).padStart(2, '0');
        pagerPos.textContent = `${pos} / ${total}`;
        mountTag.textContent = `preview · ${pos}`;

        // Update navigation buttons
        prevBtn.disabled = currentSVG.currentIndex === 0;
        nextBtn.disabled = currentSVG.currentIndex === currentSVG.total - 1;
        downloadBtn.disabled = false;
        downloadAllBtn.disabled = false;
        break;
      }
    }
  });
});
