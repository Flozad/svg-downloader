import React from 'react'
import {HeaderGlyph, ICONS} from './icons'
import {theme} from './theme'

// The extension popup, traced from extension/popup.html: a 360px column of black,
// white and grey. Header ("SVG Selector" + the N-SVGs counter + refresh), a dashed
// preview well, Previous / Next, a filename field, the black "Download Current SVG"
// primary and the outlined "Download All as ZIP" secondary, then the footer links.
// A demo that shows a control the product doesn't have is worse than no demo, so
// every row here is a row the real popup renders.

export const POPUP_W = 360

type Hot = 'refresh' | 'prev' | 'next' | 'download' | 'zip' | null

export const Popup: React.FC<{
  /** The counter, e.g. 24 — animate it if you like. */
  count: number
  /** Index into ICONS of the SVG in the preview well. */
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
  /** A "saved" confirmation toast, if any. */
  toast?: string
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
  toast,
  progress = 1,
  refreshSpin = 0,
  style,
}) => {
  const ic = ICONS[index % ICONS.length]
  const black = (on: boolean, press: boolean) => ({
    background: on ? '#1f2937' : '#0a0a0a',
    transform: press ? 'scale(0.97)' : 'none',
  })

  return (
    <div
      style={{
        width: POPUP_W,
        background: '#fff',
        borderRadius: 12,
        boxShadow: theme.shadow.popup,
        overflow: 'hidden',
        fontFamily: theme.font.sans,
        color: theme.ink,
        transformOrigin: 'top right',
        opacity: Math.min(1, progress * 2),
        transform: `scale(${0.9 + progress * 0.1})`,
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          borderBottom: `1px solid ${theme.line}`,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <HeaderGlyph size={20} />
          <span style={{fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em'}}>SVG Selector</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{fontSize: 14, color: theme.dim}}>{count} SVGs found</span>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              background: hot === 'refresh' ? '#f3f4f6' : 'transparent',
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.dim}
              style={{transform: `rotate(${refreshSpin * 360}deg)`}}
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div style={{padding: 16}}>
        {/* Preview well */}
        <div
          style={{
            position: 'relative',
            height: 200,
            border: `2px dashed ${theme.line}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            display: 'grid',
            placeItems: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 132,
              height: 132,
              color: '#0a0a0a',
              opacity: Math.min(1, preview * 1.4),
              transform: `scale(${0.85 + Math.min(1, preview) * 0.15})`,
            }}
          >
            {ic.node('#0a0a0a')}
          </div>

          {toast ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 12,
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: theme.okSoft,
                color: theme.ok,
                fontSize: 12.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.ok}>
                <path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {toast}
            </div>
          ) : null}
        </div>

        {/* Nav */}
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
          {(['prev', 'next'] as const).map((k) => {
            const disabled = k === 'prev' ? index === 0 : index >= total - 1
            const on = hot === k
            return (
              <div
                key={k}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: disabled ? theme.dim : '#fff',
                  ...(disabled
                    ? {background: '#d1d5db'}
                    : black(on, !!(on && pressed))),
                }}
              >
                {k === 'prev' ? 'Previous' : 'Next'}
              </div>
            )
          })}
        </div>

        {/* Filename */}
        <div style={{marginBottom: 8}}>
          <div
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px',
              border: `1px solid ${theme.lineStrong}`,
              borderRadius: 6,
              fontSize: 14,
              color: filename ? theme.ink : theme.dim2,
            }}
          >
            {filename || 'Enter filename (without .svg)'}
            {caret ? <span style={{color: theme.text}}>|</span> : null}
          </div>
        </div>

        {/* Color-changer helper line */}
        <div style={{marginBottom: 12, fontSize: 13, color: theme.dim}}>
          Need to change SVG colors?{' '}
          <span style={{color: theme.link}}>Use SVG Color Changer</span>
        </div>

        {/* Download current */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            ...black(hot === 'download', !!(hot === 'download' && pressed)),
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff">
            <path
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download Current SVG
        </div>

        {/* Download all as ZIP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 0',
            borderRadius: 6,
            border: '2px solid #0a0a0a',
            background: hot === 'zip' ? '#f3f4f6' : '#fff',
            color: '#0a0a0a',
            fontSize: 14,
            fontWeight: 600,
            transform: hot === 'zip' && pressed ? 'scale(0.97)' : 'none',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0a0a0a">
            <path
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4M9 9h6M9 13h6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Download All as ZIP
        </div>
      </div>

      {/* Footer */}
      <div style={{padding: '0 16px 16px'}}>
        <div style={{borderTop: `1px solid ${theme.line}`, margin: '4px 0 10px'}} />
        <div style={{textAlign: 'center', fontSize: 13, color: theme.dim}}>
          GitHub&nbsp;&nbsp;|&nbsp;&nbsp;My site&nbsp;&nbsp;|&nbsp;&nbsp;Twitter
        </div>
      </div>
    </div>
  )
}
