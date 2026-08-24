(() => {
  // Injection guard. The popup injects this file with executeScript on every
  // open; re-declaring top-level `let`s in the same isolated world throws
  // "already been declared" and registers a duplicate message listener. Hang a
  // flag off window (the isolated world's own view; the page cannot see it).
  // On a repeat injection the listener from the first injection is still live,
  // so bail out entirely and let the popup's `collectSVGs` message drive the
  // re-scan through it.
  // Stamped with the extension's own id rather than a bare `true`: after an
  // extension reload the page keeps the flag while its listener is orphaned, so
  // a bare boolean made re-injection bail and left messaging dead until the user
  // reloaded the page. A new build gets a new stamp and re-initializes.
  const INJECTION_STAMP = `${chrome.runtime.id}@${chrome.runtime.getManifest?.()?.version ?? '0'}`;
  if (window.__svgDownloaderInjected === INJECTION_STAMP) {
    return;
  }
  window.__svgDownloaderInjected = INJECTION_STAMP;

  let svgElements = [];
  let currentIndex = -1;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const XLINK_NS = 'http://www.w3.org/1999/xlink';

  // The element under the pointer when the user last opened the context menu.
  // contextmenu fires before the menu item is clicked, so this is how the
  // background's "Save this as SVG" learns *which* graphic was targeted.
  // composedPath()[0] pierces shadow DOM — the real target inside a web
  // component, not the host — falling back to event.target where unavailable.
  let lastContextTarget = null;
  document.addEventListener(
    'contextmenu',
    (event) => {
      lastContextTarget = event.composedPath?.()[0] || event.target;
    },
    true
  );

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

  // Colors that only resolve against the live page: currentColor (inherits the
  // element's `color`) and CSS custom properties (var(--x)). In a standalone
  // file neither exists, so the shape paints with the initial/inherited value —
  // often nothing (e.g. figma's icons inherit fill:none). Bake the live
  // computed color into fill/stroke so the extracted SVG looks like the page.
  function needsColorResolution(value) {
    return !!value && (value === 'currentColor' || value.includes('var('));
  }

  // Walk the live element tree and its clone in lockstep — cloneNode preserves
  // order, so index i corresponds. Must run BEFORE any structural edits (use
  // inlining) so the two trees still match.
  function resolveColors(liveRoot, cloneRoot) {
    const live = [liveRoot, ...liveRoot.querySelectorAll('*')];
    const copy = [cloneRoot, ...cloneRoot.querySelectorAll('*')];
    if (live.length !== copy.length) return;

    for (let i = 0; i < live.length; i++) {
      const node = copy[i];
      if (node.namespaceURI !== SVG_NS) continue;

      let computed = null;
      for (const prop of ['fill', 'stroke']) {
        if (
          !needsColorResolution(node.getAttribute(prop)) &&
          !needsColorResolution(node.style[prop])
        ) {
          continue;
        }
        computed = computed || getComputedStyle(live[i]);
        const resolved = computed[prop];
        if (resolved && resolved !== 'none') {
          if (node.style[prop]) node.style[prop] = resolved;
          node.setAttribute(prop, resolved);
        }
      }
    }
  }

  // Caps on the collected corpus. Every inline SVG is serialized to a string and
  // the whole list crosses the chrome.runtime message boundary in one response,
  // so a page with a few thousand SVGs — or one SVG holding megabytes of
  // generated <path> data — would hang or OOM the popup. Skipped items are
  // counted, so the popup can say so rather than silently under-reporting.
  const MAX_INLINE_SVGS = 2000;
  const MAX_SVG_BYTES = 2_000_000;

  // The same ceiling for the remote path, plus a wall-clock bound so a stalled
  // or streaming response cannot leave the popup waiting forever.
  const MAX_FETCH_BYTES = 2_000_000;
  const FETCH_TIMEOUT_MS = 10_000;

  // Read the body incrementally and bail the moment it exceeds the cap.
  // response.text() would buffer the whole thing first, so a 500MB response was
  // fully materialized in memory before being rejected — content-length is
  // advisory and absent on chunked or compressed responses. Counting bytes off
  // the wire also avoids text.length's UTF-16 undercount on CJK payloads.
  async function readCapped(response) {
    if (!response.body?.getReader) {
      const text = await response.text();
      if (new Blob([text]).size > MAX_FETCH_BYTES) throw new Error('SVG too large');
      return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_FETCH_BYTES) {
        await reader.cancel();
        throw new Error('SVG too large');
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  }

  // querySelectorAll does not cross shadow boundaries, so on any site built
  // from web components — YouTube, Salesforce Lightning, Ionic, most design
  // systems shipping custom elements — a flat query reports zero SVGs against a
  // page visibly full of icons. Walk open shadow roots too. Closed roots stay
  // unreachable by design; nothing can be done about those from here.
  // One traversal per scan, shared by every caller. Five collectors plus the id
  // index plus the background scan each used to run their own '*' walk; the DOM
  // does not change mid-scan, so they can all filter one snapshot instead. The
  // list is flat and built iteratively — `found.push(...recurse())` blew the
  // argument limit with a RangeError once a single root held ~65k matches.
  let deepElements = null;

  function allElements() {
    if (deepElements) return deepElements;
    const out = [];
    const roots = [document];
    while (roots.length > 0) {
      for (const el of roots.pop().querySelectorAll('*')) {
        out.push(el);
        if (el.shadowRoot) roots.push(el.shadowRoot);
      }
    }
    deepElements = out;
    return out;
  }

  function deepQueryAll(selector) {
    return allElements().filter((el) => el.matches(selector));
  }

  // Fallback index of every id reachable through open shadow roots, built once
  // per scan. The miss path used to run a whole-document walk per <use>, and a
  // miss is the *common* case: a page using an external sprite file misses on
  // every single icon, which on a large page is millions of element visits with
  // the popup spinner up. Reset at the top of collectSVGs.
  let shadowIdIndex = null;

  function buildShadowIdIndex() {
    const map = new Map();
    for (const el of deepQueryAll('[id]')) {
      if (!map.has(el.id)) map.set(el.id, el);
    }
    return map;
  }

  // Resolve a same-document id the way the page itself would. Id scoping is the
  // entire point of shadow DOM — collisions across roots are normal — so
  // resolution starts in the referring node's own root and only then falls back
  // outward. Searching the document first inlined an unrelated component's
  // artwork whenever two roots happened to share an id.
  function resolveRef(fromNode, id) {
    const root = fromNode.getRootNode?.();
    const scoped = root?.getElementById?.(id);
    if (scoped) return scoped;

    const direct = document.getElementById(id);
    if (direct) return direct;

    shadowIdIndex = shadowIdIndex || buildShadowIdIndex();
    return shadowIdIndex.get(id) || null;
  }

  // Split `sprite.svg#cart` into an absolute file URL and the fragment id. A
  // bare `#cart` (same-document) is handled elsewhere; this is only for the
  // external form, so both halves must be present.
  function parseExternalRef(ref) {
    const hash = ref.indexOf('#');
    if (hash <= 0) return null;
    const url = toAbsolute(ref.slice(0, hash));
    const id = ref.slice(hash + 1);
    if (!url || !id) return null;
    return { url, id };
  }

  // Turn one live <svg> into standalone markup. Same-document <use> targets are
  // inlined into a <defs> so the geometry survives; external sprite references
  // (`<use href="icons.svg#id">`) are rewritten to a local synthetic id and
  // reported as `externalUses`, for the popup (or the offscreen sanitizer) to
  // resolve by fetching the sprite file. Never mutates the live page DOM — all
  // edits happen on the clone.
  function buildStandaloneClone(svg) {
    const clone = svg.cloneNode(true);
    resolveColors(svg, clone);
    const externalUses = [];

    const uses = clone.querySelectorAll('use');
    if (uses.length > 0) {
      let defs = null;
      const inlined = new Set();
      let extIndex = 0;
      uses.forEach((use) => {
        const ref = use.getAttribute('href') || use.getAttribute('xlink:href');
        if (!ref) return;
        if (ref.startsWith('#')) {
          const id = ref.slice(1);
          if (inlined.has(id)) return;
          const target = resolveRef(svg, id);
          if (target) {
            if (!defs) {
              defs = document.createElementNS(SVG_NS, 'defs');
              clone.insertBefore(defs, clone.firstChild);
            }
            // Resolve one level only; a symbol may itself contain a <use>
            // pointing at another symbol, which is left unresolved.
            const targetClone = target.cloneNode(true);
            resolveColors(target, targetClone);
            defs.appendChild(targetClone);
            inlined.add(id);
          }
        } else {
          const parsed = parseExternalRef(ref);
          if (parsed) {
            const localId = `svgdl-ext-${extIndex++}`;
            use.setAttribute('href', `#${localId}`);
            use.removeAttribute('xlink:href');
            externalUses.push({ url: parsed.url, id: parsed.id, localId });
          }
        }
      });
    }

    // Inline HTML <svg> may omit the SVG namespace (and xmlns:xlink even when it
    // uses xlink:href) — legal in HTML, but a standalone image/svg+xml file
    // without them won't render, breaking the popup preview. Declare them on the
    // clone so the content is a valid standalone file everywhere.
    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', SVG_NS);
    }
    if (!clone.getAttribute('xmlns:xlink') && /xlink:/.test(clone.outerHTML)) {
      clone.setAttribute('xmlns:xlink', XLINK_NS);
    }

    return { content: clone.outerHTML, externalUses };
  }

  // Inline <svg>. Sprite icons are inlined (same-document) or reported for
  // deferred resolution (external), so neither downloads as an empty husk.
  function collectInlineSVGs(counters) {
    const items = [];
    deepQueryAll('svg').forEach((svg) => {
      if (!paintsSomething(svg)) return;
      if (items.length >= MAX_INLINE_SVGS) {
        counters.skipped++;
        return;
      }

      const { content, externalUses } = buildStandaloneClone(svg);
      if (content.length > MAX_SVG_BYTES) {
        counters.skipped++;
        return;
      }

      const item = { type: 'svg', content };
      if (externalUses.length > 0) {
        item.externalUses = externalUses;
      }
      items.push(item);
    });
    return items;
  }

  // <img> whose resolved src is an SVG — including query strings, fragments and
  // data URIs, which the old suffix-only attribute selector all missed.
  function collectImageSVGs() {
    const items = [];
    deepQueryAll('img').forEach((img) => {
      if (isSvgUrl(img.src)) {
        items.push({ type: 'img', content: img.src });
      }
    });
    return items;
  }

  // <object> / <embed> / <iframe> SVG hosts.
  function collectEmbeddedSVGs() {
    const items = [];

    deepQueryAll('object').forEach((el) => {
      const data = el.getAttribute('data');
      if (el.getAttribute('type') === 'image/svg+xml' || isSvgUrl(data)) {
        const abs = data && toAbsolute(data);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });

    deepQueryAll('embed').forEach((el) => {
      const src = el.getAttribute('src');
      if (el.getAttribute('type') === 'image/svg+xml' || isSvgUrl(src)) {
        const abs = src && toAbsolute(src);
        if (abs) items.push({ type: 'img', content: abs });
      }
    });

    deepQueryAll('iframe').forEach((el) => {
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

  function collectBackgroundSVGs(counters) {
    // Shares the one deep snapshot, so this now sees shadow-DOM elements too —
    // and costs no extra walk to do it.
    const all = allElements();
    // Cap the work: querySelectorAll('*') + getComputedStyle on every element is
    // O(n) with a real constant. A popup that hangs is worse than one that
    // misses a background icon on a huge page. Flag the bail-out so the popup
    // can say the scan was partial instead of implying it found everything.
    if (all.length > 10000) {
      counters.bgScanSkipped = true;
      return [];
    }

    const items = [];
    all.forEach((el) => {
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

  // Fetch a page-derived (untrusted) URL and return its text, bounded in both
  // size and time. Only http/https/data are allowed — never file: or extension
  // resources. Shared by the popup's fetchSVG message and the context-menu save
  // path, and injected into inlineExternalUses so sprite fetches run at page
  // origin. `credentials: 'omit'` keeps an authenticated, user-specific response
  // from being silently baked into a saved file.
  function fetchSvgText(url) {
    let scheme = '';
    try {
      scheme = new URL(url, document.baseURI).protocol;
    } catch {
      scheme = '';
    }
    if (scheme !== 'http:' && scheme !== 'https:' && scheme !== 'data:') {
      return Promise.reject(new Error('Unsupported URL scheme'));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return fetch(url, { signal: controller.signal, credentials: 'omit' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const declared = Number(response.headers.get('content-length'));
        if (declared > MAX_FETCH_BYTES) {
          throw new Error('SVG too large');
        }
        return readCapped(response);
      })
      .catch((error) => {
        throw new Error(error.name === 'AbortError' ? 'Timed out' : error.message);
      })
      .finally(() => clearTimeout(timer));
  }

  // Best-effort human name for a right-clicked graphic: an accessible label, a
  // <title>, or an id/filename, so the saved file isn't just "svg.svg".
  function guessName(el) {
    const svg = el?.closest?.('svg');
    if (svg) {
      const label = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent;
      if (label) return label;
      if (svg.id) return svg.id;
    }
    const img = el?.closest?.('img');
    if (img?.alt) return img.alt;
    const url = svgUrlFromElement(el);
    if (url) {
      try {
        const path = new URL(url, document.baseURI).pathname;
        const base = path
          .split('/')
          .pop()
          ?.replace(/\.svg$/i, '');
        if (base) return decodeURIComponent(base);
      } catch {
        // fall through to the default
      }
    }
    return '';
  }

  // The SVG URL a non-inline element points at: an <img>/<object>/<embed>/
  // <iframe> host, or a CSS background on the element or any ancestor. Mirrors
  // the collectors, but resolves a single clicked element rather than scanning.
  function svgUrlFromElement(el) {
    const host = el?.closest?.('img,object,embed,iframe');
    if (host) {
      if (host.tagName === 'IMG' && isSvgUrl(host.src)) return host.src;
      if (host.tagName === 'OBJECT') {
        const data = host.getAttribute('data');
        if (host.getAttribute('type') === 'image/svg+xml' || isSvgUrl(data)) return data;
      }
      if (host.tagName === 'EMBED') {
        const src = host.getAttribute('src');
        if (host.getAttribute('type') === 'image/svg+xml' || isSvgUrl(src)) return src;
      }
      if (host.tagName === 'IFRAME') {
        const src = host.getAttribute('src');
        if (isSvgUrl(src)) return src;
      }
    }

    for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      const bg = getComputedStyle(cur).backgroundImage;
      if (!bg || bg === 'none') continue;
      URL_RE.lastIndex = 0;
      let match;
      while ((match = URL_RE.exec(bg)) !== null) {
        if (isSvgUrl(match[2])) return match[2];
      }
    }
    return null;
  }

  // Resolve the last right-clicked element to a standalone, sanitized SVG file.
  // Runs at page origin so it can fetch same-origin sprites and remote images
  // the popup's activeTab grant already covers. Sanitizing here — through the
  // extension's single formatSVGContent choke point, loaded as a module — keeps
  // the context-menu download exactly as safe as every other download path.
  async function extractRightClickedSvg() {
    const el = lastContextTarget;
    let markup = null;
    let externalUses = [];

    const svg = el?.closest?.('svg');
    if (svg && paintsSomething(svg)) {
      const built = buildStandaloneClone(svg);
      markup = built.content;
      externalUses = built.externalUses;
    } else {
      const url = svgUrlFromElement(el);
      const abs = url && toAbsolute(url);
      if (abs) markup = await fetchSvgText(abs);
    }

    if (markup === null) {
      return { success: false, error: 'No SVG found here' };
    }

    const utils = await import(chrome.runtime.getURL('svg-utils.js'));
    if (externalUses.length > 0) {
      markup = await utils.inlineExternalUses(markup, externalUses, fetchSvgText);
    }
    const content = await utils.formatSVGContent(markup);
    const filename = utils.sanitizeFilename(guessName(el), 'svg');
    return { success: true, content, filename };
  }

  function dedupe(items) {
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.content)) {
        return false;
      }
      seen.add(item.content);
      return true;
    });
  }

  function collectSVGs() {
    // Rebuilt lazily per scan — the page may have changed since the last one.
    deepElements = null;
    shadowIdIndex = null;
    const counters = { skipped: 0, bgScanSkipped: false };
    const items = [
      ...collectInlineSVGs(counters),
      ...collectImageSVGs(),
      ...collectEmbeddedSVGs(),
      ...collectBackgroundSVGs(counters),
    ];

    svgElements = dedupe(items);

    // Send initial count to popup
    try {
      chrome.runtime.sendMessage(
        {
          action: 'svgsCollected',
          data: {
            count: svgElements.length,
            skipped: counters.skipped,
            bgScanSkipped: counters.bgScanSkipped,
          },
        },
        () => {
          // Must read lastError or Chrome logs "Unchecked runtime.lastError"
          // (e.g. when the popup closed before this message arrived).
          void chrome.runtime.lastError;
        }
      );

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
        chrome.runtime.sendMessage(
          {
            action: 'elementSelected',
            data: {
              ...svgElements[currentIndex],
              currentIndex,
              total: svgElements.length,
            },
          },
          () => {
            // Must read lastError or Chrome logs "Unchecked runtime.lastError"
            // (e.g. when the popup closed before this message arrived).
            void chrome.runtime.lastError;
          }
        );
      } catch (error) {
        console.error('Error in sendCurrentSVG:', error);
      }
    }
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
          fetchSvgText(request.url)
            .then((content) => sendResponse({ success: true, content }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true; // async response
        }
        case 'saveRightClicked': {
          extractRightClickedSvg()
            .then(sendResponse)
            .catch((error) => sendResponse({ success: false, error: error.message }));
          return true; // async response
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Keep the message channel open for async responses
  });

  // No scan on load. The popup always follows injection with a `collectSVGs`
  // message, so scanning here too meant every popup open paid for two full
  // passes — two querySelectorAll('*') + getComputedStyle sweeps, two
  // serializations of every inline SVG — and pushed `elementSelected` twice.
  // The popup is the single initiator.
})();
