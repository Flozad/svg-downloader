#!/usr/bin/env node
// Renders every locale of the site.
//
// English pages are rewritten in place — same prose, plus the hreflang cluster
// and the language switcher, both fenced in comment markers so the build is
// idempotent. Every other locale is written to docs/<prefix>/… from the same
// source, with the catalog's translations swapped in. Strings that have no
// translation yet fall back to English rather than blocking the build; run
// with --check to make that a failure instead.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  DEFAULT_LOCALE,
  LOCALES,
  localeUrl,
  NOINDEX_PAGES,
  SITE_URL,
  TRANSLATED_LOCALES,
} from './config.mjs';
import {
  collectJsonLd,
  DOCS_DIR,
  I18N_DIR,
  injectIntoSource,
  listSourcePages,
  loadPage,
  localizeDocument,
  serializeDocument,
} from './page.mjs';
import { collectSegments, keyOf } from './segments.mjs';

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function build({ quiet = false, check = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const pages = await listSourcePages();
  const translations = new Map();
  for (const locale of TRANSLATED_LOCALES) {
    translations.set(locale.code, await readJson(path.join(I18N_DIR, `${locale.code}.json`), {}));
  }

  for (const locale of TRANSLATED_LOCALES) {
    await rm(path.join(DOCS_DIR, locale.prefix), { recursive: true, force: true });
  }

  const missing = new Map(TRANSLATED_LOCALES.map((l) => [l.code, 0]));
  let total = 0;

  for (const page of pages) {
    // English: the authored file, with only the injected blocks added back.
    const source = await readFile(page.file, 'utf8');
    await writeFile(
      page.file,
      injectIntoSource(source, { locale: DEFAULT_LOCALE, pageId: page.id })
    );

    for (const locale of TRANSLATED_LOCALES) {
      const dom = await loadPage(page);
      const doc = dom.window.document;
      {
        const strings = translations.get(locale.code);
        const segments = [...collectSegments(doc), ...collectJsonLd(doc)];
        for (const segment of segments) {
          const value = strings[keyOf(segment.source)];
          if (value === null || value === undefined) {
            missing.set(locale.code, missing.get(locale.code) + 1);
            continue; // leave the English in place
          }
          segment.apply(value);
        }
      }
      localizeDocument(doc, { locale, pageId: page.id });
      const outFile = path.join(DOCS_DIR, locale.prefix, page.rel);
      await mkdir(path.dirname(outFile), { recursive: true });
      await writeFile(outFile, serializeDocument(dom));
    }
    total += 1;
  }

  await writeSitemap(pages);

  log(`built ${total} pages × ${LOCALES.length} locales`);
  for (const [code, count] of missing) {
    log(
      `  ${code.padEnd(6)} ${count ? `${count} untranslated strings fell back to English` : 'fully translated'}`
    );
  }
  const gaps = [...missing.values()].reduce((a, b) => a + b, 0);
  if (check && gaps) {
    console.error(
      `\n${gaps} untranslated strings — run "npm run i18n:extract" and fill in i18n/<locale>.json`
    );
    process.exitCode = 1;
  }
  return { pages: total, missing: Object.fromEntries(missing) };
}

// Keep whatever lastmod/priority the hand-written sitemap already carried for a
// page; a translation is the same document, so it inherits them.
async function writeSitemap(pages) {
  const file = path.join(DOCS_DIR, 'sitemap.xml');
  const previous = new Map();
  const existing = await readFile(file, 'utf8').catch(() => '');
  for (const block of existing.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const get = (t) => block[1].match(new RegExp(`<${t}>(.*?)</${t}>`))?.[1];
    const loc = get('loc');
    if (!loc) continue;
    previous.set(loc.replace(SITE_URL, '') || '/', {
      lastmod: get('lastmod'),
      changefreq: get('changefreq') ?? 'monthly',
      priority: get('priority') ?? '0.7',
    });
  }
  const today = new Date().toISOString().slice(0, 10);

  const entries = [];
  for (const page of pages) {
    if (NOINDEX_PAGES.includes(page.id)) continue;
    const meta = previous.get(page.id ? `/${page.id}` : '/') ?? {
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.7',
    };
    for (const locale of LOCALES) {
      const alternates = LOCALES.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${localeUrl(page.id, alt)}"/>`
      );
      alternates.push(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${localeUrl(page.id, DEFAULT_LOCALE)}"/>`
      );
      entries.push(
        [
          '  <url>',
          `    <loc>${localeUrl(page.id, locale)}</loc>`,
          ...alternates,
          `    <lastmod>${meta.lastmod ?? today}</lastmod>`,
          `    <changefreq>${meta.changefreq}</changefreq>`,
          `    <priority>${meta.priority}</priority>`,
          '  </url>',
        ].join('\n')
      );
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(file, xml);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build({ check: process.argv.includes('--check') });
}
