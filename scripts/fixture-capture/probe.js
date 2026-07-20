// Runs the real extension/content.js in the page behind a chrome-API shim, then
// judges every collected item the way the user's file viewer would: does this
// standalone file parse, and does it actually paint anything?
window.__runProbe = async () => {
  const src = await fetch('http://localhost:8931/content.js').then((r) => r.text());
  let listener = null;
  const msgs = [];
  window.chrome = {
    runtime: {
      lastError: undefined,
      sendMessage: (m, cb) => {
        msgs.push(m);
        if (cb) cb();
      },
      onMessage: {
        addListener: (fn) => {
          listener = fn;
        },
      },
    },
  };
  delete window.__svgDownloaderInjected;

  // Evaluating content.js only registers the listener — the popup is what
  // drives the scan, so the probe has to send collectSVGs the same way. Timing
  // covers the scan itself, not the (trivial) evaluation.
  (0, eval)(src);

  const t0 = performance.now();
  listener({ action: 'collectSVGs' }, null, () => {});
  const scanMs = Math.round(performance.now() - t0);

  let all = [];
  listener({ action: 'getAllSVGs' }, null, (r) => {
    all = r.svgs || [];
  });

  const RENDER = 'path,rect,circle,ellipse,line,polyline,polygon,text,image,use';
  const NONPAINT = 'defs,symbol,clipPath,mask,pattern,marker,filter';
  const verdicts = { ok: 0, parseError: 0, blank: 0, unresolvedRef: 0, zeroSize: 0, remote: 0 };
  const samples = [];
  const note = (kind, item) => {
    if (samples.length < 8) samples.push({ kind, snippet: item.content.slice(0, 260) });
  };

  for (const item of all) {
    if (item.type !== 'svg') {
      verdicts.remote++;
      continue;
    }
    const doc = new DOMParser().parseFromString(item.content, 'image/svg+xml');
    if (doc.querySelector('parsererror')) {
      verdicts.parseError++;
      note('parseError', item);
      continue;
    }
    const root = doc.documentElement;
    if (![...root.querySelectorAll(RENDER)].some((el) => !el.closest(NONPAINT))) {
      verdicts.blank++;
      note('blank', item);
      continue;
    }
    const dangling = [...root.querySelectorAll('use')].some((u) => {
      const ref = u.getAttribute('href') || u.getAttribute('xlink:href');
      return ref?.startsWith('#') && !root.querySelector(`[id="${CSS.escape(ref.slice(1))}"]`);
    });
    if (dangling) {
      verdicts.unresolvedRef++;
      note('unresolvedRef', item);
      continue;
    }
    // No width/height AND no viewBox: renders at a UA default or collapses to
    // nothing in many viewers, so the file "opens blank" even though it paints.
    const hasBox = root.getAttribute('viewBox');
    const hasDims = root.getAttribute('width') && root.getAttribute('height');
    if (!hasBox && !hasDims) {
      verdicts.zeroSize++;
      note('zeroSize', item);
      continue;
    }
    verdicts.ok++;
  }

  return {
    url: location.href,
    title: document.title.slice(0, 60),
    domNodes: document.querySelectorAll('*').length,
    scanMs,
    collected: all.length,
    reported: msgs.find((m) => m.action === 'svgsCollected')?.data,
    verdicts,
    samples,
  };
};
('probe ready');
