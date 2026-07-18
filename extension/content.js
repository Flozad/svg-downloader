(() => {
  // Injection guard. The popup injects this file with executeScript on every
  // open; re-declaring top-level `let`s in the same isolated world throws
  // "already been declared" and registers a duplicate message listener. Hang a
  // flag off window (the isolated world's own view; the page cannot see it) and
  // on a repeat injection just re-scan instead of re-initializing.
  if (window.__svgDownloaderInjected) {
    window.__svgDownloaderCollect();
    return;
  }
  window.__svgDownloaderInjected = true;

  let svgElements = [];
  let currentIndex = -1;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function isSvgUrl(url) {
    if (!url) return false;
    if (url.startsWith('data:image/svg+xml')) return true;
    try {
      // Strip query and fragment before testing the extension.
      const { pathname } = new URL(url, document.baseURI);
      return pathname.toLowerCase().endsWith('.svg');
    } catch {
      return false;
    }
  }

  function toAbsolute(url) {
    try {
      if (url.startsWith('data:')) return url;
      return new URL(url, document.baseURI).href;
    } catch {
      return null;
    }
  }

  // Elements that only ever appear inside <svg> to *define* things, never to
  // paint. A shape nested inside one of these produces no visible output.
  const NON_PAINTING = 'defs,symbol,clipPath,mask,pattern,marker,filter';
  const RENDER_ELEMENTS = 'path,rect,circle,ellipse,line,polyline,polygon,text,image,use';

  // Whether an <svg> actually paints anything: at least one rendering element
  // (or a <use>) that is NOT buried inside a definition container. Sites embed
  // invisible husk SVGs — a 0×0 aria-hidden host holding only <filter>/<symbol>
  // definitions (see designloop's dither filter) — that are not real graphics,
  // render blank, and error when loaded as a standalone image.
  function paintsSomething(svg) {
    for (const el of svg.querySelectorAll(RENDER_ELEMENTS)) {
      if (!el.closest(NON_PAINTING)) return true;
    }
    return false;
  }

  // Inline <svg>. For sprite icons (<use href="#id">) whose target is a
  // same-document symbol, inline the referenced node into a clone so the
  // extracted file is not an empty husk. Never mutate the live page DOM.
  function collectInlineSVGs(counters) {
    const items = [];
    document.querySelectorAll('svg').forEach(svg => {
      if (!paintsSomething(svg)) return;

      const uses = svg.querySelectorAll('use');
      const clone = svg.cloneNode(true);
      let hasExternalUse = false;

      if (uses.length > 0) {
        let defs = null;
        const inlined = new Set();
        clone.querySelectorAll('use').forEach(use => {
          const ref = use.getAttribute('href') || use.getAttribute('xlink:href');
          if (!ref) return;
          if (ref.startsWith('#')) {
            const id = ref.slice(1);
            if (inlined.has(id)) return;
            const target = document.getElementById(id);
            if (target) {
              if (!defs) {
                defs = document.createElementNS(SVG_NS, 'defs');
                clone.insertBefore(defs, clone.firstChild);
              }
              // Resolve one level only; a symbol may itself contain a <use>
              // pointing at another symbol, which is left unresolved.
              defs.appendChild(target.cloneNode(true));
              inlined.add(id);
            }
          } else {
            // External sprite file (e.g. /sprite.svg#cart) — cannot be inlined
            // here; the file would download blank, so skip and count it.
            hasExternalUse = true;
          }
        });
      }

      if (hasExternalUse) {
        counters.skipped++;
        return;
      }

      // Inline HTML <svg> may omit the SVG namespace (and xmlns:xlink even when
      // it uses xlink:href) — legal in HTML, but a standalone image/svg+xml file
      // without them won't render, breaking the popup preview. Declare them on
      // the clone so svg.content is a valid standalone file everywhere.
      if (!clone.getAttribute('xmlns')) {
        clone.setAttribute('xmlns', SVG_NS);
      }
      if (
        !clone.getAttribute('xmlns:xlink') &&
        /xlink:/.test(clone.outerHTML)
      ) {
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      }

      items.push({ type: 'svg', content: clone.outerHTML });
    });
    return items;
  }

  // <img> whose resolved src is an SVG — including query strings, fragments and
  // data URIs, which the old suffix-only attribute selector all missed.
  function collectImageSVGs() {
    const items = [];
    document.querySelectorAll('img').forEach(img => {
      if (isSvgUrl(img.src)) {
        items.push({ type: 'img', content: img.src });
      }
    });
    return items;
  }

  // <object> / <embed> / <iframe> SVG hosts.
  function collectEmbeddedSVGs() {
    const items = [];

    document.querySelectorAll('object').forEach(el => {
      const data = el.getAttribute('data');
      if (el.getAttribute('type') === 'image/svg+xml' || isSvgUrl(data)) {
        const abs = data && toAbsolute(data);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });

    document.querySelectorAll('embed').forEach(el => {
      const src = el.getAttribute('src');
      if (el.getAttribute('type') === 'image/svg+xml' || isSvgUrl(src)) {
        const abs = src && toAbsolute(src);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });

    document.querySelectorAll('iframe').forEach(el => {
      const src = el.getAttribute('src');
      if (isSvgUrl(src)) {
        const abs = toAbsolute(src);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });

    return items;
  }

  // SVGs applied as CSS backgrounds. getComputedStyle works regardless of the
  // stylesheet's origin (cross-origin CSSOM rules are unreadable), so use it
  // rather than walking document.styleSheets.
  const URL_RE = /url\((['"]?)(.*?)\1\)/g;

  function collectBackgroundSVGs() {
    const all = document.querySelectorAll('*');
    // Cap the work: querySelectorAll('*') + getComputedStyle on every element is
    // O(n) with a real constant. A popup that hangs is worse than one that
    // misses a background icon on a huge page.
    if (all.length > 10000) {
      return [];
    }

    const items = [];
    all.forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;

      URL_RE.lastIndex = 0;
      let match;
      while ((match = URL_RE.exec(bg)) !== null) {
        const raw = match[2];
        if (!isSvgUrl(raw)) continue;
        const abs = toAbsolute(raw);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });
    return items;
  }

  function dedupe(items) {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.content)) {
        return false;
      }
      seen.add(item.content);
      return true;
    });
  }

  function collectSVGs() {
    const counters = { skipped: 0 };
    const items = [
      ...collectInlineSVGs(counters),
      ...collectImageSVGs(),
      ...collectEmbeddedSVGs(),
      ...collectBackgroundSVGs(),
    ];

    svgElements = dedupe(items);

    // Send initial count to popup
    try {
      chrome.runtime.sendMessage({
        action: 'svgsCollected',
        data: {
          count: svgElements.length,
          skipped: counters.skipped
        }
      }, () => {
        // Must read lastError or Chrome logs "Unchecked runtime.lastError"
        // (e.g. when the popup closed before this message arrived).
        void chrome.runtime.lastError;
      });

      if (svgElements.length > 0) {
        currentIndex = 0;
        sendCurrentSVG();
      }
    } catch (error) {
      console.error('Error in collectSVGs:', error);
    }
  }

  function sendCurrentSVG() {
    if (currentIndex >= 0 && currentIndex < svgElements.length) {
      try {
        chrome.runtime.sendMessage({
          action: 'elementSelected',
          data: {
            ...svgElements[currentIndex],
            currentIndex,
            total: svgElements.length
          }
        }, () => {
          // Must read lastError or Chrome logs "Unchecked runtime.lastError"
          // (e.g. when the popup closed before this message arrived).
          void chrome.runtime.lastError;
        });
      } catch (error) {
        console.error('Error in sendCurrentSVG:', error);
      }
    }
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      switch (request.action) {
        case 'collectSVGs':
          collectSVGs();
          sendResponse({ success: true });
          break;
        case 'nextSVG':
          if (currentIndex < svgElements.length - 1) {
            currentIndex++;
            sendCurrentSVG();
          }
          sendResponse({ success: true });
          break;
        case 'previousSVG':
          if (currentIndex > 0) {
            currentIndex--;
            sendCurrentSVG();
          }
          sendResponse({ success: true });
          break;
        case 'getAllSVGs':
          // The popup only needs the full markup at ZIP time, so it asks for it
          // on demand instead of paying to ship it on every navigation.
          sendResponse({ success: true, svgs: svgElements });
          break;
        case 'fetchSVG': {
          // The URL originates from page content — untrusted. Only fetch web and
          // data URLs; never let it read file: or extension resources.
          let scheme = '';
          try {
            scheme = new URL(request.url, document.baseURI).protocol;
          } catch {
            scheme = '';
          }
          if (scheme !== 'http:' && scheme !== 'https:' && scheme !== 'data:') {
            sendResponse({ success: false, error: 'Unsupported URL scheme' });
            break;
          }
          fetch(request.url)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }
              return response.text();
            })
            .then(text => sendResponse({ success: true, content: text }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true; // async response
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Keep the message channel open for async responses
  });

  // Expose the collector so a repeat injection can re-scan without
  // re-registering the message listener.
  window.__svgDownloaderCollect = collectSVGs;

  // Initialize when the script loads
  collectSVGs();
})();
