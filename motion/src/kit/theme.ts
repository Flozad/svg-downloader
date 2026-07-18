// The SVG Downloader palette. The product is minimal and monochrome — a 360px
// popup in black, white and grey, Tailwind's neutral scale, one black primary
// button and one outlined secondary. These recordings must not drift from that:
// there is no brand colour here on purpose. Ink on paper, and nothing else.
//
// Every scene draws from this so the whole set reads as one product.

export const theme = {
  // Paper. A cool, near-white porcelain for the stage, pure white for surfaces.
  bg: '#f4f4f5', // zinc-100 — the stage the browser sits on
  bg2: '#e4e4e7', // zinc-200 — wells, footers
  panel: '#ffffff', // the popup and cards
  panelSunk: '#f4f4f5',

  // Ink — Tailwind neutral, the exact greys the popup uses.
  text: '#0a0a0a', // near-black: headings, primary buttons
  ink: '#111827', // gray-900 — body ink
  dim: '#6b7280', // gray-500 — the "N SVGs found" counter, secondary copy
  dim2: '#9ca3af', // gray-400 — placeholders, empty states
  line: '#e5e7eb', // gray-200 — hairlines, card borders
  lineStrong: '#d1d5db', // gray-300 — input borders
  dash: '#d4d4d8', // zinc-300 — the dashed preview box

  // The one link colour the popup allows (the SVG Color Changer link).
  link: '#2563eb', // blue-600

  // Feedback — kept muted, monochrome-adjacent.
  ok: '#16a34a', // green-600 — the "saved" tick
  okSoft: 'rgba(22, 163, 74, 0.12)',

  radius: {sm: 6, md: 8, lg: 12, panel: 12, pill: 999},

  font: {
    // The popup rides Tailwind's default stack — the system grotesque. So do
    // these recordings. No bundled face, so nothing to load and nothing to drift.
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
  },

  shadow: {
    card: '0 1px 2px rgba(10,10,10,0.05), 0 8px 24px -12px rgba(10,10,10,0.18)',
    pop: '0 12px 40px -12px rgba(10,10,10,0.30), 0 0 0 1px rgba(10,10,10,0.06)',
    lift: '0 24px 60px -24px rgba(10,10,10,0.40)',
    popup: '0 20px 50px -12px rgba(10,10,10,0.35), 0 0 0 1px rgba(10,10,10,0.08)',
  },
} as const

// Canvas sizes. The Chrome Web Store's preferred screenshot is 1280×800; the
// promo video rides the same shape so a still lifted from it drops straight into
// a screenshot slot.
export const SHOT = {width: 1280, height: 800, fps: 30} as const
export const PROMO = {width: 1280, height: 800, fps: 30} as const
export const PROMO_TILE = {width: 440, height: 280, fps: 30} as const
export const MARQUEE = {width: 1400, height: 560, fps: 30} as const
