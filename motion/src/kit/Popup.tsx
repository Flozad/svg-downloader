import React from 'react'
import {ICONS} from './icons'
import {SHEET, theme} from './theme'

// The extension popup, traced row for row from extension/popup.html and
// extension/popup.css: a 360px column of ruled bone stock. Header (the wordmark,
// the "N FOUND" counter chip, rescan, settings), the registered preview plate,
// the Prev / N / M / Next pager, the SVG · PNG · JPG format segment, the
// Filename field with its .svg suffix, the plotter-green "Download current"
// primary, the outlined "Download all as ZIP", the Copy code / Copy image pair,
// the status line, the colour hand-off, and the colophon foot.
//
// A demo that shows a control the product doesn't have is worse than no demo, so
// every row here is a row the real popup renders, and nothing here is invented —
// the status line says what popup.js actually writes into it.

export const POPUP_W = 360

export type Hot =
  | 'refresh'
  | 'settings'
  | 'prev'
  | 'next'
  | 'download'
  | 'zip'
  | 'copyCode'
  | 'copyImage'
  | 'svg'
  | 'png'
  | 'jpg'
  | null

export type Format = 'svg' | 'png' | 'jpg'

export const Popup: React.FC<{
  /** The counter, e.g. 24 — animate it if you like. */
  count: number
  /** Index into ICONS of the SVG on the preview plate. */
  index: number
  total: number
  filename: string
  caret?: boolean
  /** Preview pop-in, 0..1. */
  preview?: number
  /** Which control the cursor is on. */
  hot?: Hot
  /** The hot control is pressed. */
  pressed?: boolean
  /** The real `.status` line — exactly what popup.js writes there. */
  status?: string
  /** Selected output format. PNG and JPG reveal the size selector, as they do live. */
  format?: Format
  /** The raster multiplier shown beside the format segment. */
  scale?: 1 | 2 | 4
  /** Entrance, 0 = closed, 1 = open. */
  progress?: number
  refreshSpin?: number
  style?: React.CSSProperties
}> = ({
  count,
  index,
  total,
  filename,
  caret,
  preview = 1,
  hot,
  pressed,
  status,
  format = 'svg',
  scale = 2,
  progress = 1,
  refreshSpin = 0,
  style,
}) => {
  const ic = ICONS[index % ICONS.length]
  const press = (k: Hot) => (hot === k && pressed ? 'translateY(1px) scale(0.995)' : 'none')

  return (
    <div
      style={{
        width: POPUP_W,
        background: theme.paper,
        ...SHEET,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.popup,
        overflow: 'hidden',
        fontFamily: theme.font.sans,
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: '-0.006em',
        color: theme.ink,
        transformOrigin: 'top right',
        opacity: Math.min(1, progress * 2),
        transform: `scale(${0.9 + progress * 0.1})`,
        ...style,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          borderBottom: `1px solid ${theme.line}`,
        }}
      >
        <span style={{display: 'inline-flex', alignItems: 'center', gap: 9}}>
          <Mark size={22} />
          <strong
            style={{
              fontFamily: theme.font.display,
              fontSize: 15,
              fontWeight: 600,
              fontVariationSettings: '"opsz" 18, "wght" 640',
              letterSpacing: '-0.02em',
            }}
          >
            SVG&nbsp;Downloader
          </strong>
        </span>

        <span style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6}}>
          {/* The counter chip goes plotter green the moment it has something. */}
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              borderRadius: theme.radius.pill,
              whiteSpace: 'nowrap',
              color: count > 0 ? theme.plot : theme.dim,
              background: count > 0 ? theme.plotWash : theme.surface,
              border: `1px solid ${count > 0 ? theme.plotLine : theme.line}`,
            }}
          >
            {count} found
          </span>
          <IconBtn on={hot === 'refresh'} spin={refreshSpin}>
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </IconBtn>
          <IconBtn on={hot === 'settings'}>
            <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
            <path
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.31.22.65.22 1s-.08.69-.22 1z"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </IconBtn>
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{padding: 14, display: 'flex', flexDirection: 'column', gap: 12}}>
        {/* Preview plate, registered at opposite corners like a drawing on a light table. */}
        <div
          style={{
            position: 'relative',
            height: 190,
            background: theme.surfaceHi,
            border: `1px solid ${theme.line2}`,
            borderRadius: theme.radius.panel,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: theme.shadow.card,
          }}
        >
          <Tick corner="tl" />
          <Tick corner="br" />
          <span
            style={{
              position: 'absolute',
              top: -1,
              right: 14,
              zIndex: 2,
              fontFamily: theme.font.mono,
              fontSize: 9.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: theme.dim,
              background: theme.paper,
              border: `1px solid ${theme.line}`,
              borderTop: 0,
              borderRadius: `0 0 ${theme.radius.node}px ${theme.radius.node}px`,
              padding: '3px 8px 2px',
            }}
          >
            preview · {index + 1}
          </span>

          <div
            style={{
              width: 128,
              height: 128,
              color: theme.ink,
              opacity: Math.min(1, preview * 1.4),
              transform: `scale(${0.85 + Math.min(1, preview) * 0.15})`,
            }}
          >
            {ic.node(theme.ink)}
          </div>
        </div>

        {/* Pager */}
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <Btn quiet grow on={hot === 'prev'} disabled={index === 0} transform={press('prev')}>
            <Glyph d="M15 18l-6-6 6-6" />
            <span>Prev</span>
          </Btn>
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: theme.dim,
              minWidth: 56,
              textAlign: 'center',
              flex: 'none',
            }}
          >
            {index + 1} / {total}
          </span>
          <Btn quiet grow on={hot === 'next'} disabled={index >= total - 1} transform={press('next')}>
            <span>Next</span>
            <Glyph d="M9 6l6 6-6 6" />
          </Btn>
        </div>

        {/* Format segment — the size selector only exists for the raster formats. */}
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <div
            style={{
              display: 'inline-flex',
              flex: 1,
              padding: 2,
              gap: 2,
              background: theme.surface,
              border: `1px solid ${theme.line2}`,
              borderRadius: theme.radius.node,
            }}
          >
            {(['svg', 'png', 'jpg'] as const).map((f) => {
              const on = format === f
              return (
                <span
                  key={f}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '6px 0',
                    fontFamily: theme.font.mono,
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    borderRadius: 2,
                    color: on ? theme.surfaceHi : hot === f ? theme.ink : theme.dim,
                    background: on ? theme.plot : 'transparent',
                    boxShadow: on ? `0 1px 0 ${theme.plotDeep}` : 'none',
                  }}
                >
                  {f.toUpperCase()}
                </span>
              )
            })}
          </div>

          {format === 'svg' ? null : (
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none'}}>
              <span
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: theme.dim,
                }}
              >
                Size
              </span>
              <span
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 12,
                  color: theme.ink,
                  padding: '6px 8px',
                  background: theme.surfaceHi,
                  border: `1px solid ${theme.line2}`,
                  borderRadius: theme.radius.node,
                }}
              >
                {scale}×
              </span>
            </span>
          )}
        </div>

        {/* Filename */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          <span
            style={{
              fontFamily: theme.font.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: theme.dim,
            }}
          >
            Filename
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              background: theme.surfaceHi,
              border: `1px solid ${caret ? theme.plot : theme.line2}`,
              borderRadius: theme.radius.node,
              boxShadow: caret ? `0 0 0 3px ${theme.plotWash}` : 'none',
            }}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                padding: '9px 4px 9px 12px',
                fontFamily: theme.font.mono,
                fontSize: 12.5,
                color: filename ? theme.ink : theme.dim2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {filename || 'star'}
              {caret ? <span style={{color: theme.plot}}>|</span> : null}
            </span>
            <span
              style={{
                paddingRight: 12,
                fontFamily: theme.font.mono,
                fontSize: 12.5,
                color: theme.dim2,
              }}
            >
              .{format}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <Btn on={hot === 'download'} transform={press('download')}>
            <svg width={17} height={17} viewBox="0 0 48 48" fill="none" style={{flex: 'none'}}>
              <path
                d="M24 12v16m0 0l-7-7m7 7l7-7"
                stroke={theme.surfaceHi}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="16" y="34" width="16" height="2.6" rx="1.3" fill={theme.surfaceHi} />
            </svg>
            <span>Download current</span>
          </Btn>
          <Btn quiet on={hot === 'zip'} transform={press('zip')}>
            <Glyph d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4M9 9h6M9 13h6" w={1.6} />
            <span>Download all as ZIP</span>
          </Btn>
        </div>

        {/* Copy row */}
        <div style={{display: 'flex', flexDirection: 'row', gap: 8}}>
          <Btn quiet sm grow on={hot === 'copyCode'} transform={press('copyCode')}>
            <Glyph d="M8 4h9a2 2 0 012 2v10m-4 4H7a2 2 0 01-2-2V8a2 2 0 012-2h7a2 2 0 012 2v10a2 2 0 01-2 2z" w={1.6} />
            <span>Copy code</span>
          </Btn>
          <Btn quiet sm grow on={hot === 'copyImage'} transform={press('copyImage')}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={theme.ink} style={{flex: 'none'}}>
              <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.6" />
              <circle cx="8.5" cy="10" r="1.5" strokeWidth="1.6" />
              <path d="M21 15l-5-5L5 19" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Copy image</span>
          </Btn>
        </div>

        {/* The real status line. popup.js writes plain sentences here, so this does too. */}
        {status ? (
          <p
            style={{
              margin: 0,
              fontFamily: theme.font.mono,
              fontSize: 11,
              lineHeight: 1.5,
              letterSpacing: '0.01em',
              color: theme.plot,
              textAlign: 'center',
            }}
          >
            {status}
          </p>
        ) : null}

        {/* Colour hand-off */}
        <p
          style={{
            margin: 0,
            fontFamily: theme.font.mono,
            fontSize: 11,
            lineHeight: 1.5,
            color: theme.dim,
            textAlign: 'center',
          }}
        >
          Need a different colour?{' '}
          <span style={{color: theme.plot, borderBottom: `1px solid ${theme.plotLine}`}}>
            Open SVG Color Changer
          </span>
        </p>
      </div>

      {/* ── Colophon ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 14px',
          borderTop: `1px solid ${theme.line}`,
          background: theme.paper2,
          fontFamily: theme.font.mono,
          fontSize: 10.5,
          letterSpacing: '0.02em',
          color: theme.dim,
        }}
      >
        <span>GitHub</span>
        <span style={{color: theme.dim2}}>·</span>
        <span>clasicwebtools</span>
        <span style={{color: theme.dim2}}>·</span>
        <span>Twitter</span>
        <span style={{flex: 1}} />
        <span style={{color: theme.dim2, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 9.5}}>
          on&nbsp;device
        </span>
      </div>
    </div>
  )
}

/** The extension's own mark, as the popup header draws it (outlined, not filled). */
const Mark: React.FC<{size?: number}> = ({size = 22}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{flex: 'none'}}>
    <rect width="48" height="48" rx="10" fill={theme.plot} />
    <path
      d="M24 13v15m0 0l-6.5-6.5M24 28l6.5-6.5"
      stroke={theme.surfaceHi}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="16.5" y="33.5" width="15" height="2.4" rx="1.2" fill={theme.surfaceHi} />
  </svg>
)

const Tick: React.FC<{corner: 'tl' | 'br'}> = ({corner}) => (
  <span
    style={{
      position: 'absolute',
      width: 11,
      height: 11,
      borderColor: theme.tick,
      borderStyle: 'solid',
      borderWidth: 0,
      ...(corner === 'tl'
        ? {top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1}
        : {bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1}),
    }}
  />
)

const IconBtn: React.FC<{on?: boolean; spin?: number; children: React.ReactNode}> = ({
  on,
  spin = 0,
  children,
}) => (
  <span
    style={{
      width: 28,
      height: 28,
      flex: 'none',
      display: 'grid',
      placeItems: 'center',
      color: on ? theme.ink : theme.dim,
      border: `1px solid ${on ? theme.line : 'transparent'}`,
      borderRadius: theme.radius.node,
      background: on ? theme.surface : 'transparent',
    }}
  >
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      style={{transform: `rotate(${spin * 360}deg)`}}
    >
      {children}
    </svg>
  </span>
)

const Glyph: React.FC<{d: string; w?: number}> = ({d, w = 1.8}) => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{flex: 'none'}}>
    <path d={d} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** The popup's two button shapes: the plotter-green primary and the outlined quiet. */
const Btn: React.FC<{
  children: React.ReactNode
  quiet?: boolean
  sm?: boolean
  grow?: boolean
  on?: boolean
  disabled?: boolean
  transform?: string
}> = ({children, quiet, sm, grow, on, disabled, transform}) => (
  <span
    style={{
      fontFamily: theme.font.mono,
      fontSize: sm ? 11.5 : 12,
      letterSpacing: '0.01em',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: sm ? '7px 12px' : '9px 14px',
      borderRadius: theme.radius.node,
      boxSizing: 'border-box',
      flex: grow ? 1 : undefined,
      width: grow ? undefined : '100%',
      opacity: disabled ? 0.42 : 1,
      transform: transform ?? 'none',
      ...(quiet
        ? {
            color: theme.ink,
            border: `1px solid ${on && !disabled ? theme.ink : theme.line2}`,
            background: on && !disabled ? theme.surfaceHi : theme.surface,
          }
        : {
            color: theme.surfaceHi,
            background: on ? theme.plotDeep : theme.plot,
            boxShadow: disabled ? 'none' : theme.shadow.primary,
          }),
    }}
  >
    {children}
  </span>
)
