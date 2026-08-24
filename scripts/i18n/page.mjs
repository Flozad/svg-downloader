// Loading, localising and re-serialising a page of the site.
//
// English is the source of record: the files under docs/ that are not inside a
// locale directory. Everything a locale needs beyond translated prose — the
// path prefix on every internal link, <html lang>, og:locale, the JSON-LD
// urls, the hreflang cluster and the language switcher — is applied here so a
// translator only ever edits sentences.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import {
  DEFAULT_LOCALE,
  LOCALES,
  localePath,
  localeUrl,
  SHARED_PATH_PREFIXES,
  SITE_URL,
} from './config.mjs';

export const DOCS_DIR = path.resolve(import.meta.dirname, '../../docs');
export const I18N_DIR = path.resolve(import.meta.dirname, '../../i18n');

const LOCALE_DIRS = new Set(LOCALES.filter((l) => l.prefix).map((l) => l.prefix));
const NON_PAGE_DIRS = new Set(['fonts', 'motion', '.vercel', 'node_modules']);

// JSON-LD fields that hold prose, and fields that hold one of our own URLs.
const JSONLD_TEXT_KEYS = new Set([
  'name',
  'description',
  'headline',
  'text',
  'alternateName',
  'caption',
  'slogan',
  'abstract',
  'disambiguatingDescription',
  'articleSection',
]);
const JSONLD_URL_KEYS = new Set(['url', '@id', 'item', 'mainEntityOfPage', 'primaryImageOfPage']);

const MARKERS = ['alternates', 'switch'];

/** Every English source page, as { id, file, rel }. */
export async function listSourcePages(dir = DOCS_DIR, rel = '') {
  const pages = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.vercel') continue;
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (LOCALE_DIRS.has(entry.name) || NON_PAGE_DIRS.has(entry.name)) continue;
      pages.push(...(await listSourcePages(path.join(dir, entry.name), relPath)));
    } else if (entry.name.endsWith('.html')) {
      pages.push({ id: pageId(relPath), rel: relPath, file: path.join(dir, entry.name) });
    }
  }
  return pages.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** 'index.html' -> '', 'features/index.html' -> 'features', 'a/b.html' -> 'a/b'. */
export function pageId(rel) {
  const withoutExt = rel.replace(/\.html$/, '');
  return withoutExt.replace(/(^|\/)index$/, '');
}

/** Drop previously injected blocks so the build is idempotent.
 *
 * The injected text begins with its opening marker and ends with its closing
 * one — never any surrounding whitespace — so removing the markers and what is
 * between them gives back the authored file, byte for byte.
 */
export function stripInjected(html) {
  let out = html;
  for (const name of MARKERS) {
    out = out.replace(new RegExp(`<!--i18n:${name}-->[\\s\\S]*?<!--/i18n:${name}-->`, 'g'), '');
  }
  return out;
}

/** The hreflang cluster: every locale of this page, plus x-default. */
export function alternatesHtml(id) {
  const links = LOCALES.map(
    (alt) => `<link rel="alternate" hreflang="${alt.hreflang}" href="${localeUrl(id, alt)}">`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${localeUrl(id, DEFAULT_LOCALE)}">`);
  return `<!--i18n:alternates-->\n${links.join('\n')}\n<!--/i18n:alternates-->`;
}

/** The language switcher: a disclosure, so it works with JavaScript off. Every
 *  language is a real link to the same page, which is also how a crawler finds
 *  the translations. */
export function switcherHtml({ locale, pageId: id, indent = '  ' }) {
  const pad = (n) => indent + '  '.repeat(n);
  const items = LOCALES.map((alt) => {
    const current = alt.code === locale.code ? ' aria-current="true"' : '';
    return `${pad(2)}<li><a href="${localePath(id, alt)}" hreflang="${alt.hreflang}" lang="${alt.htmlLang}"${current}>${alt.label}</a></li>`;
  });
  return [
    '<!--i18n:switch-->',
    `${indent}<details class="lang-switch">`,
    `${pad(1)}<summary aria-label="${locale.switchLabel}"><span>${locale.short}</span></summary>`,
    `${pad(1)}<ul>`,
    ...items,
    `${pad(1)}</ul>`,
    `${indent}</details>`,
    `${indent}<!--/i18n:switch-->`,
  ].join('\n');
}

/** The English page keeps its hand-authored formatting: the hreflang cluster
 *  and the switcher go in as text, not through a parse/serialise round-trip. */
export function injectIntoSource(html, { locale, pageId: id }) {
  let out = stripInjected(html);
  const alternates = alternatesHtml(id);
  if (/<link rel="canonical"[^>]*>/.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/, (m) => m + alternates);
  } else {
    out = out.replace('</head>', `${alternates}\n</head>`);
  }
  const switcher = switcherHtml({ locale, pageId: id });
  if (/<span class="nav-links">/.test(out)) {
    out = out.replace(/<span class="nav-links">[\s\S]*?<\/span>/, (m) => m + switcher);
  }
  return out;
}

export async function loadPage(page) {
  const html = stripInjected(await readFile(page.file, 'utf8'));
  return new JSDOM(html);
}

const isSharedPath = (p) =>
  SHARED_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));

/** Rewrite one site-internal path or absolute URL into `locale`. */
export function localizeHref(href, locale) {
  if (!href) return href;
  let pathPart = null;
  let absolute = false;
  if (href.startsWith('/') && !href.startsWith('//')) {
    pathPart = href;
  } else if (href.startsWith(SITE_URL)) {
    pathPart = href.slice(SITE_URL.length) || '/';
    absolute = true;
  } else {
    return href;
  }
  if (isSharedPath(pathPart)) return href;
  if (!locale.prefix) return href;
  const localized = pathPart === '/' ? `/${locale.prefix}/` : `/${locale.prefix}${pathPart}`;
  return absolute ? `${SITE_URL}${localized}` : localized;
}

/** Collect the translatable strings inside every JSON-LD block on the page. */
export function collectJsonLd(doc) {
  const segments = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      continue;
    }
    const write = () => {
      script.textContent = `\n${JSON.stringify(data, null, 2)}\n`;
    };
    walkJsonLd(data, (holder, key) => {
      segments.push({
        type: 'jsonld',
        source: holder[key].trim(),
        apply: (v) => {
          holder[key] = v;
          write();
        },
      });
    });
  }
  return segments;
}

function walkJsonLd(node, onText) {
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, onText);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') {
      if (JSONLD_TEXT_KEYS.has(key) && !/^https?:\/\//.test(value)) onText(node, key);
    } else {
      walkJsonLd(value, onText);
    }
  }
}

/** Apply everything that is mechanical rather than editorial. */
export function localizeDocument(doc, { locale, pageId: id }) {
  const html = doc.documentElement;
  html.setAttribute('lang', locale.htmlLang);

  for (const el of doc.querySelectorAll('a[href], link[href], form[action]')) {
    const attr = el.tagName === 'FORM' ? 'action' : 'href';
    el.setAttribute(attr, localizeHref(el.getAttribute(attr), locale));
  }
  for (const meta of doc.querySelectorAll('meta[property="og:url"], meta[name="twitter:url"]')) {
    meta.setAttribute('content', localizeHref(meta.getAttribute('content'), locale));
  }
  const ogLocale = doc.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute('content', locale.ogLocale);

  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      continue;
    }
    localizeJsonLdUrls(data, locale);
    script.textContent = `\n${JSON.stringify(data, null, 2)}\n`;
  }

  injectAlternates(doc, id);
  injectSwitcher(doc, { locale, pageId: id });
}

function localizeJsonLdUrls(node, locale) {
  if (Array.isArray(node)) {
    for (const item of node) localizeJsonLdUrls(item, locale);
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string') {
      if (JSONLD_URL_KEYS.has(key)) node[key] = localizeHref(value, locale);
      else if (key === 'inLanguage') node[key] = locale.htmlLang;
    } else {
      localizeJsonLdUrls(value, locale);
    }
  }
}

function injectAlternates(doc, id) {
  const head = doc.querySelector('head');
  const anchor = doc.querySelector('link[rel="canonical"]') ?? head.lastElementChild;
  anchor.insertAdjacentHTML('afterend', alternatesHtml(id));
}

function injectSwitcher(doc, { locale, pageId: id }) {
  const anchor = doc.querySelector('nav.nav .nav-links');
  if (!anchor) return;
  anchor.insertAdjacentHTML('afterend', switcherHtml({ locale, pageId: id }));
}

export function serializeDocument(dom) {
  return `${dom.serialize()}\n`.replace(/\n\n+<\/head>/, '\n</head>');
}
