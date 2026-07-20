import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.join(here, '../extension');
const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));

// The manifest is the part of the extension with the highest blast radius and
// the slowest feedback loop: a mistake here is caught by a Web Store reviewer
// days later, not by a failing build. package.sh already guards the version;
// this guards everything else.
describe('manifest.json', () => {
  it('declares only the permissions the extension actually uses', () => {
    // A permission added by accident is both a store-review risk and a privacy
    // regression — Chrome shows the user a scarier install prompt. Adding one
    // deliberately should mean updating this list and the privacy copy.
    expect(new Set(manifest.permissions)).toEqual(
      new Set(['activeTab', 'downloads', 'scripting', 'storage'])
    );
  });

  it('requests no host permissions', () => {
    // The README, the store listing and the popup footer all claim the
    // extension reads a page only when invoked. host_permissions would make
    // that claim false.
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toBeUndefined();
    expect(JSON.stringify(manifest)).not.toContain('<all_urls>');
  });

  it('keeps a CSP that forbids remote and inline script', () => {
    const csp = manifest.content_security_policy?.extension_pages ?? '';
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
    // Chrome does not synthesize default-src, so every directive left undeclared
    // is unrestricted. Pin the fallback explicitly.
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("base-uri 'none'");
  });

  it('points every declared icon at a file that exists', () => {
    const declared = [
      ...Object.values(manifest.icons ?? {}),
      ...Object.values(manifest.action?.default_icon ?? {}),
    ];
    expect(declared.length).toBeGreaterThan(0);
    for (const rel of declared) {
      expect(fs.existsSync(path.join(extensionDir, rel)), `missing icon: ${rel}`).toBe(true);
    }
  });

  it('points its HTML entry points at files that exist', () => {
    const pages = [manifest.action?.default_popup, manifest.options_ui?.page].filter(Boolean);
    expect(pages).toHaveLength(2);
    for (const rel of pages) {
      expect(fs.existsSync(path.join(extensionDir, rel)), `missing page: ${rel}`).toBe(true);
    }
  });

  it('is manifest v3', () => {
    expect(manifest.manifest_version).toBe(3);
  });
});

// The popup loads JSZip as a classic script and popup.js as a module. That pair
// is easy to break silently when editing the markup, and it fails only at
// runtime in a real browser, which no other test here exercises.
describe('popup.html script tags', () => {
  const html = fs.readFileSync(path.join(extensionDir, 'popup.html'), 'utf8');

  it('loads every script from a local file, never a CDN', () => {
    const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      expect(src).not.toMatch(/^https?:/);
      expect(fs.existsSync(path.join(extensionDir, src)), `missing script: ${src}`).toBe(true);
    }
  });

  it('keeps popup.js as a module and jszip as a classic script', () => {
    expect(html).toMatch(/<script\s+type="module"\s+src="popup\.js">/);
    expect(html).toMatch(/<script\s+src="lib\/jszip\.min\.js">/);
  });

  it('has no inline script, which the CSP would block', () => {
    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];
    expect(inline.filter((m) => m[1].trim().length > 0)).toHaveLength(0);
  });
});
