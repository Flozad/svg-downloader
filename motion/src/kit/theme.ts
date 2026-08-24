// The SVG Downloader palette, taken from extension/popup.css — which is itself
// cut from docs/style.css. The product is a drafting table: warm bone stock,
// graphite ink, one plotter green, a heavy grotesque against a monospace
// technical voice. These recordings must not drift from that, so every value
// below is the same value the shipped CSS custom property holds.
//
// Two families live here on purpose:
//
//   • the PRODUCT tokens (paper…plotWash, plus `font.display` / `font.mono`)
//     draw anything the extension itself renders — the popup, the brand card;
//   • the BROWSER tokens (`chrome.*`) stay true neutral grey, because a Chrome
//     window is Chrome's design, not ours. Warming those would read as a themed
//     browser rather than as a real one.

export const theme = {
  // ── Stock ────────────────────────────────────────────────────────────────
  paper: '#ece4d3', // the popup's own ground, and the stage under the browser
  paper2: '#e3d9c3', // the colophon foot
  surface: '#f6f1e6', // quiet buttons, the counter chip
  surfaceHi: '#fbf8f0', // the preview plate, inputs, text ON plotter green

  // ── Ink ──────────────────────────────────────────────────────────────────
  ink: '#1b1a15', // graphite — headings, primary text
  ink2: '#47443a', // body
  dim: 'rgba(27, 26, 21, 0.62)', // the counter, mono labels
  dim2: 'rgba(27, 26, 21, 0.40)', // placeholders, empty states
  line: 'rgba(27, 26, 21, 0.16)', // hairlines
  line2: 'rgba(27, 26, 21, 0.28)', // input and button borders
  tick: 'rgba(27, 26, 21, 0.34)', // the mount's registration corners

  // ── The one voice ────────────────────────────────────────────────────────
  plot: '#1f5a3a',
  plotBright: '#2e8b57',
  plotDeep: '#143f29',
  plotWash: 'rgba(31, 90, 58, 0.10)',
  plotLine: 'rgba(31, 90, 58, 0.30)',

  // ── Legacy aliases ───────────────────────────────────────────────────────
  // Kept so the browser chrome and older shots keep compiling. `text`/`panel`
  // are the neutral pair; prefer `ink`/`surfaceHi` for anything the product draws.
  bg: '#ece4d3',
  bg2: '#e3d9c3',
  panel: '#ffffff',
  panelSunk: '#f6f1e6',
  text: '#1b1a15',
  lineStrong: 'rgba(27, 26, 21, 0.28)',
  dash: 'rgba(27, 26, 21, 0.28)',
  link: '#1f5a3a',
  ok: '#1f5a3a', // the "saved" tick is the plotter green — there is no second colour
  okSoft: 'rgba(31, 90, 58, 0.10)',

  // ── Browser chrome — Chrome's greys, not ours ────────────────────────────
  chrome: {
    tabStrip: '#dee1e6',
    surface: '#ffffff',
    omnibox: '#f1f3f4',
    line: '#e5e7eb',
    dim: '#6b7280',
    dim2: '#9ca3af',
    text: '#202124',
  },

  // Anchor-square radii: near-sharp nodes, a softer panel, a pill.
  radius: {node: 3, sm: 3, md: 6, lg: 10, panel: 10, pill: 999},

  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    display: '"Bricolage Grotesque", "Arial Narrow", -apple-system, sans-serif',
    mono: '"Space Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
  },

  shadow: {
    card: '0 1px 0 rgba(255,255,255,0.6) inset, 0 20px 40px -34px rgba(27,26,21,0.6)',
    pop: '0 12px 40px -12px rgba(27,26,21,0.30), 0 0 0 1px rgba(27,26,21,0.10)',
    lift: '0 24px 60px -24px rgba(27,26,21,0.45)',
    popup: '0 20px 50px -12px rgba(27,26,21,0.35), 0 0 0 1px rgba(27,26,21,0.14)',
    primary: '0 1px 0 #143f29, 0 10px 22px -14px rgba(20, 63, 41, 0.7)',
  },
} as const

/** The 22px drafting grid the popup and the site both rule their ground with. */
export const SHEET = {
  backgroundImage: `linear-gradient(${theme.line} 1px, transparent 1px), linear-gradient(90deg, ${theme.line} 1px, transparent 1px)`,
  backgroundSize: '22px 22px',
  backgroundPosition: 'center top',
} as const

// Canvas sizes. The Chrome Web Store's preferred screenshot is 1280×800; the
// promo video rides the same shape so a still lifted from it drops straight into
// a screenshot slot. Tutorial clips ride it too, so one <video> box on the site
// fits every one of them.
export const SHOT = {width: 1280, height: 800, fps: 30} as const
export const PROMO = {width: 1280, height: 800, fps: 30} as const
export const TUTORIAL = {width: 1280, height: 800, fps: 30} as const
export const PROMO_TILE = {width: 440, height: 280, fps: 30} as const
export const MARQUEE = {width: 1400, height: 560, fps: 30} as const
