import { formatSVGContent, sanitizeFilename } from './svg-utils.js';
import { renderPreview } from './preview.js';
import { getSettings } from './settings.js';

let currentSVG = null;
let isLoading = false;
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
    isLoading = loading_state;
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

  async function injectContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active tab found');

      // Check if we can access the tab. Chrome allows only http(s) pages, and
      // even then hard-blocks injection on the Web Store / extensions gallery,
      // so treat those as unreachable up front with a clear message.
      if (!tab.url || !tab.url.startsWith('http')) {
        throw new Error('Cannot access this page');
      }
      if (isRestrictedUrl(tab.url)) {
        throw new Error('Cannot access this page: restricted by the browser');
      }

      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

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
    return m.includes('Receiving end does not exist') ||
           m.includes('message port closed');
  }

  async function injectAndCollect() {
    const tab = await injectContentScript();
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'collectSVGs' });
    if (!response || !response.success) {
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
        showError("This is a browser page the extension can't read. Open a regular website and try again.");
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

  // Handle navigation
  async function sendTabMessage(action) {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      if (!tab) throw new Error('No active tab found');
      return await chrome.tabs.sendMessage(tab.id, {action});
    } catch (error) {
      console.error(`Error sending ${action} message:`, error);
      showError('Error navigating SVGs. Please try again.');
    }
  }

  // Fetch a cross-origin SVG URL through the content script, which runs in the
  // page's own origin under activeTab — so no host permission is needed. Throws
  // on failure; callers turn the rejection into the right user-facing message.
  async function fetchSVGContent(url) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'fetchSVG', url });
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to fetch SVG');
    }
    return response.content;
  }

  prevBtn.addEventListener('click', () => sendTabMessage('previousSVG'));
  nextBtn.addEventListener('click', () => sendTabMessage('nextSVG'));

  // Handle single download
  downloadBtn.addEventListener('click', () => {
    if (!currentSVG) return;
    downloadSVG(currentSVG);
  });

  // Handle bulk download
  downloadAllBtn.addEventListener('click', async () => {
    // Ask the content script for the full list on demand — navigation messages
    // no longer carry it, so it isn't re-serialized on every Prev/Next click.
    let svgs;
    try {
      const response = await sendTabMessage('getAllSVGs');
      if (!response || !response.success) throw new Error('Failed to list SVGs');
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

      // Add all SVGs to the zip
      const promises = svgs.map(async (svg, index) => {
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
      });

      await Promise.all(promises);

      if (failures.length === svgs.length) {
        showError('None of the SVGs on this page could be exported.');
        return;
      }

      // Generate and download the zip
      const blob = await zip.generateAsync({type: 'blob'});
      const url = URL.createObjectURL(blob);
      try {
        await chrome.downloads.download({
          url: url,
          filename: `${settings.zipName}.zip`
        });
      } finally {
        URL.revokeObjectURL(url);
      }

      if (failures.length > 0) {
        showStatus(`Downloaded ${svgs.length - failures.length} of ${svgs.length} SVGs. Skipped: ${failures.join(', ')}.`);
      } else {
        showStatus(`Downloaded ${svgs.length} SVGs as ZIP.`);
      }
    } catch (error) {
      console.error('Error creating ZIP:', error);
      showError('Error creating ZIP file. Please try again.');
    }
  });

  async function downloadSVG(svg) {
    const filenameInput = document.getElementById('filenameInput');
    const filename = sanitizeFilename(filenameInput.value, `${settings.filenamePrefix}-${svg.currentIndex + 1}`);

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
          showError('This SVG is hosted on another domain and could not be downloaded. Try opening the image in a new tab and saving it directly.');
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

    const blob = new Blob([formattedContent], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    try {
      await chrome.downloads.download({ url, filename });
    } catch (error) {
      console.error('Error downloading SVG:', error);
      showError('Error downloading SVG. Please try again.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Handle messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'svgsCollected':
        const { count } = request.data;
        setCounter(count);
        setLoading(false);

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

      case 'elementSelected':
        currentSVG = request.data;

        // Update preview
        noPreview.classList.add('hidden');
        emptyState.classList.add('hidden');
        preview.classList.remove('hidden');

        previewObjectUrl = renderPreview(preview, currentSVG, previewObjectUrl);

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
  });
});
