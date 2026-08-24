// Single source of truth for the multilingual build.
//
// English is authored by hand in `docs/**.html`. Every other locale is
// generated from it by `scripts/i18n/build.mjs`, which swaps the extracted
// prose for the strings in `i18n/<locale>.json` and republishes the page under
// that locale's path prefix. Adding a language is: append an entry here, run
// `npm run i18n:extract`, fill in the new JSON file, run `npm run i18n:build`.

export const SITE_URL = 'https://svg.clasicwebtools.com';

// `prefix` is the URL segment ('' for the default locale, which lives at the
// root so existing links and rankings keep working). `hreflang` is what goes in
// the alternate tags, `htmlLang` in <html lang>, `ogLocale` in og:locale.
export const LOCALES = [
  {
    code: 'en',
    short: 'EN',
    prefix: '',
    hreflang: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    label: 'English',
    // Shown in the language switcher's aria-label, in that language.
    switchLabel: 'Language',
    default: true,
  },
  {
    code: 'es',
    short: 'ES',
    prefix: 'es',
    hreflang: 'es',
    htmlLang: 'es',
    ogLocale: 'es_ES',
    label: 'Español',
    switchLabel: 'Idioma',
  },
  {
    code: 'fr',
    short: 'FR',
    prefix: 'fr',
    hreflang: 'fr',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    label: 'Français',
    switchLabel: 'Langue',
  },
  {
    code: 'de',
    short: 'DE',
    prefix: 'de',
    hreflang: 'de',
    htmlLang: 'de',
    ogLocale: 'de_DE',
    label: 'Deutsch',
    switchLabel: 'Sprache',
  },
  {
    code: 'pt-BR',
    short: 'PT',
    prefix: 'pt-br',
    hreflang: 'pt-BR',
    htmlLang: 'pt-BR',
    ogLocale: 'pt_BR',
    label: 'Português',
    switchLabel: 'Idioma',
  },
];

export const DEFAULT_LOCALE = LOCALES.find((l) => l.default);
export const TRANSLATED_LOCALES = LOCALES.filter((l) => !l.default);

export const localeByCode = (code) => LOCALES.find((l) => l.code === code);

// Paths that are the same file for every language: assets, and the machine
// endpoints that are not per-locale documents.
export const SHARED_PATH_PREFIXES = [
  '/fonts/',
  '/motion/',
  '/icon.svg',
  '/style.css',
  '/pages.css',
  '/player.js',
  '/site.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
];

// Pages that exist as files but should stay out of the sitemap.
export const NOINDEX_PAGES = ['404'];

// `page` here is the clean URL path without a locale prefix: '' for the home
// page, 'features/inline-svg' for a nested one.
export function localePath(page, locale) {
  const prefix = locale.prefix ? `/${locale.prefix}` : '';
  return page ? `${prefix}/${page}` : `${prefix}/`;
}

export function localeUrl(page, locale) {
  return `${SITE_URL}${localePath(page, locale)}`;
}
