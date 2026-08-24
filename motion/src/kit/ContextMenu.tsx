import React from 'react'
import {theme} from './theme'

/**
 * Chrome's right-click menu, with the item background.js actually installs:
 * "Save this as SVG", registered on the `image` and `page` contexts. The
 * surrounding items are Chrome's own, drawn in Chrome's grey so the extension's
 * one row is visibly a guest in somebody else's menu — which is exactly what it
 * is, and exactly what a viewer needs to recognise on their own screen.
 *
 * The separator sits where Chrome puts it: extension-contributed items land in
 * their own group below the built-ins.
 */
export const ContextMenu: React.FC<{
  /** Entrance, 0..1 — menus snap, so drive this fast. */
  progress?: number
  /** Highlight the extension's row (the pointer is on it). */
  hot?: boolean
  /**
   * Which of Chrome's menus this is. An inline <svg> is not an image as far as
   * the browser is concerned, so right-clicking an icon gives the PAGE menu —
   * which is exactly why "Save image as…" is not on offer and the extension's
   * row is the only thing there that can save the vector. Use 'image' only when
   * the target really is an <img>.
   */
  context?: 'page' | 'image'
  style?: React.CSSProperties
}> = ({progress = 1, hot, context = 'page', style}) => {
  const c = theme.chrome
  const items =
    context === 'image'
      ? ['Open image in new tab', 'Save image as…', 'Copy image', 'Copy image address', 'Inspect']
      : ['Back', 'Forward', 'Reload', 'Save as…', 'Print…', 'View page source', 'Inspect']

  return (
    <div
      style={{
        width: 232,
        padding: '6px 0',
        background: c.surface,
        border: `1px solid ${c.line}`,
        borderRadius: 8,
        boxShadow: '0 12px 34px -10px rgba(27,26,21,0.38), 0 0 0 1px rgba(27,26,21,0.05)',
        fontFamily: theme.font.sans,
        fontSize: 13,
        color: c.text,
        transformOrigin: 'top left',
        opacity: Math.min(1, progress * 2.4),
        transform: `scale(${0.96 + Math.min(1, progress) * 0.04})`,
        ...style,
      }}
    >
      {items.map((label) => (
        <div key={label} style={{padding: '6px 14px', whiteSpace: 'nowrap'}}>
          {label}
        </div>
      ))}

      <div style={{height: 1, background: c.line, margin: '6px 0'}} />

      {/* The extension's row. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 14px',
          whiteSpace: 'nowrap',
          background: hot ? theme.plotWash : 'transparent',
          color: hot ? theme.plot : c.text,
          fontWeight: hot ? 600 : 400,
        }}
      >
        <svg width={15} height={15} viewBox="0 0 48 48" fill="none" style={{flex: 'none'}}>
          <rect width="48" height="48" rx="10" fill={theme.plot} />
          <path
            d="M24 13v15m0 0l-6.5-6.5M24 28l6.5-6.5"
            stroke={theme.surfaceHi}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="17" y="33.5" width="14" height="2.6" rx="1.3" fill={theme.surfaceHi} />
        </svg>
        Save this as SVG
      </div>
    </div>
  )
}
