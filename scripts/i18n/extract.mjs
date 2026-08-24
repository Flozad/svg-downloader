#!/usr/bin/env node
// Rebuilds i18n/catalog.json from the English pages and syncs every locale
// file against it: new strings arrive as null (meaning "not translated yet",
// which the build falls back to English for), strings that no longer exist on
// the site are dropped. Safe to run any time; it never overwrites a
// translation.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { TRANSLATED_LOCALES } from './config.mjs';
import { collectJsonLd, I18N_DIR, listSourcePages, loadPage } from './page.mjs';
import { collectSegments, keyOf } from './segments.mjs';

const catalogPath = path.join(I18N_DIR, 'catalog.json');

export async function extract({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const pages = await listSourcePages();
  const catalog = {};
  const warnings = [];

  for (const page of pages) {
    const dom = await loadPage(page);
    const doc = dom.window.document;
    const onWarn = (message) => warnings.push(`${page.rel}: ${message}`);
    const segments = [...collectSegments(doc, { onWarn }), ...collectJsonLd(doc)];
    for (const segment of segments) {
      const key = keyOf(segment.source);
      const entry =
        catalog[key] ?? (catalog[key] = { type: segment.type, text: segment.source, pages: [] });
      if (!entry.pages.includes(page.id)) entry.pages.push(page.id);
    }
  }

  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

  const stats = [];
  for (const locale of TRANSLATED_LOCALES) {
    const file = path.join(I18N_DIR, `${locale.code}.json`);
    let existing = {};
    try {
      existing = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      existing = {};
    }
    const next = {};
    let translated = 0;
    for (const key of Object.keys(catalog)) {
      const value = existing[key] ?? null;
      next[key] = value;
      if (value !== null) translated += 1;
    }
    const dropped = Object.keys(existing).filter((k) => !(k in catalog)).length;
    await writeFile(file, `${JSON.stringify(next, null, 2)}\n`);
    stats.push({ locale: locale.code, translated, total: Object.keys(catalog).length, dropped });
  }

  const words = Object.values(catalog).reduce((n, e) => n + e.text.split(/\s+/).length, 0);
  log(
    `catalog: ${Object.keys(catalog).length} strings, ~${words} words, from ${pages.length} pages`
  );
  for (const s of stats) {
    log(
      `  ${s.locale.padEnd(6)} ${s.translated}/${s.total} translated${s.dropped ? ` (${s.dropped} stale dropped)` : ''}`
    );
  }
  if (warnings.length) {
    log(`\n${warnings.length} warning(s):`);
    for (const w of warnings.slice(0, 40)) log(`  ${w}`);
  }
  return { catalog, warnings, stats };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await extract();
