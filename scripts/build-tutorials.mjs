// Builds docs/tutorials/ — fifteen tutorial pages plus their index — from
// scripts/tutorials-content.mjs and the Remotion render manifest.
//
// Why generate rather than hand-write: fifteen pages share one <head>, one nav,
// one footer and four blocks of structured data. Hand-maintained, they drift —
// a canonical points at the wrong slug, a footer gains a link on nine pages out
// of fifteen, a VideoObject claims a duration the file doesn't have. Here the
// chrome is written once, and the duration is read from
// docs/motion/tutorials/manifest.json, which the render script writes from the
// same beat list it renders the video from.
//
// The output is committed static HTML — this is a build step for the author, not
// for the deploy. Vercel still serves plain files.
//
//   node scripts/build-tutorials.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TUTORIALS } from './tutorials-content.mjs';

const ROOT = fileURLToPath(new URL('../docs/', import.meta.url));
const OUT = `${ROOT}tutorials/`;
const ORIGIN = 'https://svg.clasicwebtools.com';
const STORE =
  'https://chromewebstore.google.com/detail/svg-web-downloader-extrac/jfgljaebonkbegekbcfbiojgkjlbhpjn';

mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(readFileSync(`${ROOT}motion/tutorials/manifest.json`, 'utf8'));
const byId = Object.fromEntries(manifest.map((m) => [m.id, m]));

// The date the tutorial set went live. Structured data wants an uploadDate, and
// a date that moves every time the file is rebuilt is worse than one that is
// simply true of the publication.
const PUBLISHED = '2026-08-22';

const esc = (s) =>
  String(s)
    .replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Strip tags for use inside a JSON-LD string. */
const plain = (s) =>
  String(s)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const json = (o) => JSON.stringify(o, null, 2).replace(/</g, '\\u003c');

// ── Shared chrome ──────────────────────────────────────────────────────────

const NAV = (current) => `
<nav class="nav">
  <a class="brand" href="/">
    <svg class="mark" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="var(--plot)"/>
      <path d="M24 13v15m0 0l-6.5-6.5M24 28l6.5-6.5" fill="none" stroke="var(--surface-hi)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="16.5" y="33.5" width="15" height="2.4" rx="1.2" fill="var(--surface-hi)"/>
    </svg>
    <strong>SVG&nbsp;Downloader</strong>
  </a>
  <span class="spacer"></span>
  <span class="nav-links">
    <a href="/features">Features</a>
    <a href="/tutorials"${current === 'tutorials' ? ' aria-current="page"' : ''}>Tutorials</a>
    <a href="/guides">Guides</a>
    <a href="/docs">Docs</a>
    <a href="/use-cases">Stories</a>
  </span>
  <a class="nav-cta" href="${STORE}">Get the extension</a>
</nav>`;

const FOOTER = `
<footer>
  <nav class="bleed foot-map" aria-label="Site map">
    <div class="col"><p>Product</p><ul>
      <li><a href="/">Overview</a></li>
      <li><a href="/features">Features</a></li>
      <li><a href="/compare/svg-downloader-vs-screenshotting-icons">Vs. screenshotting</a></li>
      <li><a href="/privacy">Privacy</a></li>
      <li><a href="/use-cases">Use cases</a></li>
    </ul></div>
    <div class="col"><p>Catches</p><ul>
      <li><a href="/features/inline-svg">Inline SVG</a></li>
      <li><a href="/features/css-background-svg">CSS background SVG</a></li>
      <li><a href="/features/svg-sprite-extractor">Sprite / &lt;use&gt; SVG</a></li>
      <li><a href="/features/bulk-zip-download">Whole page as ZIP</a></li>
    </ul></div>
    <div class="col"><p>Tutorials</p><ul>
      <li><a href="/tutorials">All 15 tutorials</a></li>
      <li><a href="/tutorials/how-to-download-svg-files">How to download SVG files</a></li>
      <li><a href="/tutorials/copy-svg-from-website">Copy an SVG</a></li>
      <li><a href="/tutorials/extract-svg-from-website">Extract every SVG</a></li>
    </ul></div>
    <div class="col"><p>Docs</p><ul>
      <li><a href="/docs/installation">Installation</a></li>
      <li><a href="/docs/usage">Usage</a></li>
      <li><a href="/docs/faq">FAQ</a></li>
      <li><a href="/docs/changelog">Changelog</a></li>
    </ul></div>
  </nav>
  <div class="bleed colophon-foot">
    <a href="https://github.com/Flozad/svg-downloader">GitHub</a>
    <a href="https://github.com/Flozad/svg-downloader/issues">Issues</a>
    <a href="https://clasicwebtools.com">clasicwebtools.com</a>
    <span class="grow"></span>
    <span>Bone stock, graphite, one plotter&nbsp;green</span>
  </div>
</footer>`;

const head = ({
  title,
  description,
  url,
  image,
  imageAlt,
  video,
  type = 'article',
  extraMeta = '',
}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="author" content="Flozad">
<meta name="theme-color" content="#ece4d3">
<meta property="og:site_name" content="SVG Downloader">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}${image}">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta property="og:locale" content="en_US">${
  video
    ? `
<meta property="og:video" content="${ORIGIN}${video.video}">
<meta property="og:video:secure_url" content="${ORIGIN}${video.video}">
<meta property="og:video:type" content="video/mp4">
<meta property="og:video:width" content="1280">
<meta property="og:video:height" content="800">`
    : ''
}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@lozards">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ORIGIN}${image}">${extraMeta}
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/bricolage-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/pages.css">`;

// ── One tutorial page ──────────────────────────────────────────────────────

const tutorialPage = (t) => {
  const m = byId[t.slug];
  if (!m) throw new Error(`No rendered video for ${t.slug} — run motion's render:tutorials first`);

  const url = `${ORIGIN}/tutorials/${t.slug}`;

  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Tutorials', item: `${ORIGIN}/tutorials` },
        { '@type': 'ListItem', position: 3, name: plain(t.crumb), item: url },
      ],
    },
    {
      '@type': 'VideoObject',
      name: t.videoName,
      description: t.videoDescription,
      thumbnailUrl: [`${ORIGIN}${m.poster}`],
      uploadDate: PUBLISHED,
      duration: m.duration,
      contentUrl: `${ORIGIN}${m.video}`,
      embedUrl: url,
      isFamilyFriendly: true,
      publisher: {
        '@type': 'Organization',
        name: 'SVG Downloader',
        url: ORIGIN,
      },
    },
    {
      // The HowTo restates the page's own task and steps rather than carrying
      // its own copy, so the structured data can't describe a procedure the page
      // doesn't show. Name is the H1 with its markup stripped; the steps are the
      // same array the <ol> renders from.
      '@type': 'HowTo',
      name: plain(t.h1),
      description: t.description,
      image: `${ORIGIN}${m.poster}`,
      totalTime: t.totalTime ?? 'PT2M',
      tool: { '@type': 'HowToTool', name: 'SVG Downloader browser extension' },
      step: t.steps.map((s) => ({
        '@type': 'HowToStep',
        name: plain(s.name),
        text: plain(s.text),
        url: `${url}#steps`,
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: t.faq.map((f) => ({
        '@type': 'Question',
        name: plain(f.q),
        acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
      })),
    },
  ];

  return `${head({
    title: t.title,
    description: t.description,
    url,
    image: m.poster,
    imageAlt: t.posterAlt,
    video: m,
  })}
<script type="application/ld+json">
${json({ '@context': 'https://schema.org', '@graph': graph })}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${NAV('tutorials')}

<main id="main">
<header class="page-hero"><div class="wrap">
  <ol class="crumbs">
    <li><a href="/">Home</a></li>
    <li><a href="/tutorials">Tutorials</a></li>
    <li><span aria-current="page">${t.crumb}</span></li>
  </ol>
  <p class="eyebrow">${t.eyebrow}</p>
  <h1>${t.h1}</h1>
  <p class="lede">${t.lede}</p>
  <div class="cta">
    <a class="btn primary" href="${STORE}">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 12v16m0 0l-7-7m7 7l7-7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="34" width="16" height="2.6" rx="1.3" fill="currentColor"/></svg>
      Get the extension
    </a>
    <a class="btn quiet" href="#steps">Jump to the steps ↓</a>
  </div>
</div></header>

<section class="prose"><div class="wrap">
  <p class="eyebrow">Watch it — ${m.seconds < 60 ? `${Math.round(m.seconds)} seconds` : m.duration}</p>
  <h2>${t.videoHeading}</h2>
  <figure class="shot">
    <div class="shot-mount">
      <span class="shot-tag">${t.videoTag}</span>
      <video src="${m.video}" poster="${m.poster}"
        muted loop playsinline preload="none"
        aria-label="${esc(t.videoDescription)}"></video>
    </div>
    <figcaption class="shot-cap">${t.videoCaption}</figcaption>
  </figure>

  <p class="lead-in">${t.videoIntro}</p>
  <p class="eyebrow">What the recording shows</p>
  <ol class="beats">
${m.captions.map((c) => `    <li>${esc(c)}</li>`).join('\n')}
  </ol>
</div></section>

<hr class="section-rule">

<section class="prose"><div class="wrap">
  <p class="eyebrow">${t.bodyEyebrow}</p>
  <h2>${t.bodyHeading}</h2>
  ${t.body}

  <h2 id="steps">${t.stepsHeading}</h2>
  <p>${t.stepsIntro}</p>
  <ol>
${t.steps.map((s) => `    <li><strong>${s.name}.</strong> ${s.text}</li>`).join('\n')}
  </ol>

  ${t.after ?? ''}

  <dl class="facts">
${t.facts.map(([k, v]) => `    <div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n')}
  </dl>
</div></section>

<hr class="section-rule">

<section class="prose"><div class="wrap">
  <p class="eyebrow">Good to know</p>
  <h2>Frequently asked</h2>
  <div class="faq">
${t.faq
  .map(
    (f) => `    <details>
      <summary>${f.q}</summary>
      <div class="faq-body"><p>${f.a}</p></div>
    </details>`
  )
  .join('\n')}
  </div>
</div></section>

<hr class="section-rule">

<section><div class="wrap">
  <div class="cta-band">
    <div>
      <h2>${t.ctaHeading}</h2>
      <p>${t.ctaSub}</p>
    </div>
    <div class="cta">
      <a class="btn primary" href="${STORE}">Get the extension</a>
      <a class="btn quiet" href="/tutorials">All 15 tutorials →</a>
    </div>
  </div>
</div></section>

<section class="related"><div class="wrap">
  <p class="eyebrow">Keep going</p>
  <ul>
${t.related.map(([href, label, sub]) => `    <li><a href="${href}">${label}<span>${sub}</span></a></li>`).join('\n')}
  </ul>
</div></section>
</main>
${FOOTER}
<script src="/player.js" defer></script>
</body>
</html>
`;
};

// ── The index ──────────────────────────────────────────────────────────────

const indexPage = () => {
  const url = `${ORIGIN}/tutorials`;
  const graph = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Tutorials', item: url },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'SVG Downloader video tutorials',
      description:
        'Fifteen short video tutorials covering every way to download, extract, copy and save an SVG from a website.',
      numberOfItems: TUTORIALS.length,
      itemListElement: TUTORIALS.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: plain(t.cardTitle),
        url: `${ORIGIN}/tutorials/${t.slug}`,
      })),
    },
  ];

  return `${head({
    title: 'SVG Download Tutorials — 15 Short Video Walkthroughs',
    description:
      'Fifteen video tutorials for downloading SVGs from any website: from a URL, from a link, from HTML, as a ZIP, as PNG, or copied straight to your clipboard.',
    url,
    image: '/motion/tutorials/how-to-download-svg-files.jpg',
    imageAlt: 'The SVG Downloader popup previewing an icon it found on a page.',
    type: 'website',
  })}
<script type="application/ld+json">
${json({ '@context': 'https://schema.org', '@graph': graph })}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${NAV('tutorials')}

<main id="main">
<header class="page-hero"><div class="wrap">
  <ol class="crumbs">
    <li><a href="/">Home</a></li>
    <li><span aria-current="page">Tutorials</span></li>
  </ol>
  <p class="eyebrow">Tutorials — fifteen recordings, none of them longer than a minute</p>
  <h1>SVG download <span class="plot">tutorials</span></h1>
  <p class="lede">Every one of these is a real recording of the extension doing the job, with the step written underneath it. Pick the one that matches what you have — a URL, a link, a page full of icons, or a logo you need at full size.</p>
  <div class="cta">
    <a class="btn primary" href="${STORE}">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 12v16m0 0l-7-7m7 7l7-7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="16" y="34" width="16" height="2.6" rx="1.3" fill="currentColor"/></svg>
      Get the extension
    </a>
    <a class="btn quiet" href="/tutorials/how-to-download-svg-files">Start with the basics →</a>
  </div>
</div></header>

<section class="prose"><div class="wrap">
  <p class="eyebrow">Start where you are</p>
  <h2>Fifteen tutorials, one workflow</h2>
  <p class="lead-in">They all end the same way — the original vector on your disk or in your clipboard — but they start from different places, because you do. Each page carries its own recording, the steps in writing, and the answers to whatever usually goes wrong at that particular step.</p>

  <ul class="cards">
${TUTORIALS.map(
  (t) => `    <li><a class="card" href="/tutorials/${t.slug}">
      <span class="card-tag">${t.cardTag}</span>
      <h3>${t.cardTitle}</h3>
      <p>${t.cardBlurb}</p>
      <span class="card-go">Watch &amp; read →</span>
    </a></li>`
).join('\n')}
  </ul>
</div></section>

<hr class="section-rule">

<section class="prose"><div class="wrap">
  <p class="eyebrow">If you only read one thing</p>
  <h2>Why the browser won't just save it for you</h2>
  <p>An SVG on a modern page is almost never a file sitting at an address. It is one of four things, and each one defeats <em>Save image as…</em> in its own way: <a href="/features/inline-svg">inline <code>&lt;svg&gt;</code></a> markup drawn straight into the HTML with no URL behind it; a <a href="/features/css-background-svg">CSS <code>background-image</code></a> the browser treats as decoration; a <a href="/features/svg-sprite-extractor">sprite <code>&lt;use&gt;</code></a> reference that points into a hidden document; or an <code>&lt;img&gt;</code> source that may be a <code>data:</code> URI the save menu mangles.</p>
  <p>Every tutorial here works the same way underneath: read the live DOM, resolve whatever each vector really is, repair the missing <code>xmlns</code> namespace, and hand you a standalone file. That is why the method doesn't care which of the four you happened to land on.</p>
</div></section>

<hr class="section-rule">

<section><div class="wrap">
  <div class="cta-band">
    <div>
      <h2>Install once, then never fight a right-click menu again</h2>
      <p>Free, MIT-licensed, and it runs entirely on your machine — no upload, no account, no analytics.</p>
    </div>
    <div class="cta">
      <a class="btn primary" href="${STORE}">Get the extension</a>
      <a class="btn quiet" href="/docs/installation">Install guide →</a>
    </div>
  </div>
</div></section>

<section class="related"><div class="wrap">
  <p class="eyebrow">Related</p>
  <ul>
    <li><a href="/guides">The long-form guides<span>More depth, fewer videos</span></a></li>
    <li><a href="/features">Every feature<span>What it detects, and how</span></a></li>
    <li><a href="/use-cases">Use cases<span>Real jobs, start to finish</span></a></li>
  </ul>
</div></section>
</main>
${FOOTER}
</body>
</html>
`;
};

// ── Write ──────────────────────────────────────────────────────────────────

let n = 0;
for (const t of TUTORIALS) {
  writeFileSync(`${OUT}${t.slug}.html`, tutorialPage(t));
  n++;
}
writeFileSync(`${OUT}index.html`, indexPage());
console.log(`Wrote ${n} tutorial pages + index → docs/tutorials/`);

// The sitemap is NOT written here. scripts/i18n/build.mjs regenerates
// docs/sitemap.xml from the files on disk, with hreflang alternates per locale,
// so it picks these pages up on its own. Two writers on one sitemap is how you
// get sixteen duplicate <url> entries, so this script deliberately has none —
// run `node scripts/i18n/build.mjs` after this to refresh the sitemap.
console.log('Sitemap: run scripts/i18n/build.mjs to refresh it (it owns that file).');
