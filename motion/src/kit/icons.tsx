import React from 'react'

// The icons the mock website is built from — and the very things the extension
// pulls off the page. Every one is a real inline <svg>, monochrome, on a 24 grid,
// so the popup's "24 SVGs found" count is literally true of the page beside it.
//
// Drawn as stroked line icons (the house style of most icon sets a designer
// would be raiding), plus a couple of solid logo-style marks for variety.

export type IconDef = {name: string; node: (stroke: string) => React.ReactNode}

const S = (d: string, stroke: string, opts?: {fill?: string; w?: number}) => (
  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
    <path
      d={d}
      fill={opts?.fill ?? 'none'}
      stroke={stroke}
      strokeWidth={opts?.w ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ICONS: IconDef[] = [
  {name: 'search', node: (s) => S('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4', s)},
  {name: 'heart', node: (s) => S('M12 20s-7-4.5-9.2-8.3A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5.7C19 15.5 12 20 12 20z', s)},
  {name: 'star', node: (s) => S('M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3z', s)},
  {name: 'bell', node: (s) => S('M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0', s)},
  {name: 'camera', node: (s) => S('M4 7h3l2-2h6l2 2h3v12H4V7zM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', s)},
  {name: 'cloud', node: (s) => S('M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 11a3.5 3.5 0 0 1-.5 7H7z', s)},
  {name: 'download', node: (s) => S('M12 3v11m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2', s)},
  {name: 'settings', node: (s) => S('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z', s, {w: 1.5})},
  {name: 'user', node: (s) => S('M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', s)},
  {name: 'mail', node: (s) => S('M4 5h16v14H4V5zM4 6l8 6 8-6', s)},
  {name: 'calendar', node: (s) => S('M5 5h14v15H5V5zM3 9h18M8 3v4M16 3v4', s)},
  {name: 'chart', node: (s) => S('M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6', s)},
  {name: 'lock', node: (s) => S('M6 11h12v9H6v-9zM8 11V8a4 4 0 0 1 8 0v3', s)},
  {name: 'home', node: (s) => S('M4 11l8-7 8 7M6 10v10h12V10', s)},
  {name: 'trash', node: (s) => S('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', s)},
  {name: 'edit', node: (s) => S('M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4', s)},
  {name: 'play', node: (s) => S('M7 4l13 8-13 8V4z', s, {fill: s})},
  {name: 'image', node: (s) => S('M4 5h16v14H4V5zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 18l5-5 3 3 2-2 4 4', s)},
  {name: 'map-pin', node: (s) => S('M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', s)},
  {name: 'tag', node: (s) => S('M3 12l9-9h7v7l-9 9-7-7zM15.5 8.5a1 1 0 1 0 0-.01', s)},
  {name: 'bookmark', node: (s) => S('M6 3h12v18l-6-4-6 4V3z', s)},
  {name: 'share', node: (s) => S('M8 12a3 3 0 1 0 0-.01M18 6a3 3 0 1 0 0-.01M18 18a3 3 0 1 0 0-.01M10.5 10.5l5-3M10.5 13.5l5 3', s)},
  {name: 'globe', node: (s) => S('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z', s)},
  {name: 'folder', node: (s) => S('M4 6h6l2 2h8v11H4V6z', s)},
]

/**
 * The website's own wordmark: a solid rounded-square "vault" mark with a bolt,
 * the kind of logo an SVG library would ship as one inline <svg>. It is the 25th
 * vector on the page — but the counter reads 24 because the extension foregrounds
 * the icon grid.
 */
export const SiteLogo: React.FC<{size?: number; color?: string}> = ({size = 26, color = '#0a0a0a'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill={color} />
    <path d="M13 6l-5 7h3l-1 5 5-7h-3l1-5z" fill="#fff" />
  </svg>
)

/**
 * The extension's OWN icon, traced from extension/icons/icon.svg: a black rounded
 * square, a download arrow, and the tray line under it. This is the mark that
 * rides the browser's extension row and the store tiles.
 */
export const ExtMark: React.FC<{size?: number; radius?: number}> = ({size = 20, radius}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect width="48" height="48" rx={radius ?? 10} fill="#0a0a0a" />
    <path
      d="M24 13v15m0 0l-6.5-6.5M24 28l6.5-6.5"
      stroke="#fff"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="17" y="33.5" width="14" height="2.6" rx="1.3" fill="#fff" />
  </svg>
)

/** The small header glyph the popup shows next to "SVG Selector". */
export const HeaderGlyph: React.FC<{size?: number; color?: string}> = ({size = 20, color = '#0a0a0a'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M3 5h18v14H3V5zm9 10l4-4-4-4M8 10l4 4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
