import React from 'react'
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion'
import {ExtMark} from './icons'
import {theme} from './theme'

/**
 * The bed every scene sits on. Two jobs: put the clip on the porcelain the whole
 * set shares so the video doesn't read as a foreign rectangle, and fade the
 * first/last few frames so a loop or a cut has no hard seam.
 *
 * The fade goes on the CONTENT over an opaque bed — never the whole frame. A
 * video has no alpha, so fading the root fades toward black; the bed stays solid
 * and only what sits on it dissolves.
 */
export const Stage: React.FC<{children: React.ReactNode; pad?: number; bg?: string; fade?: boolean}> = ({
  children,
  pad = 0,
  bg = theme.bg,
  fade: doFade = true,
}) => {
  const frame = useCurrentFrame()
  const {fps, durationInFrames} = useVideoConfig()
  const fade = 0.3 * fps

  const opacity = doFade
    ? Math.min(
        interpolate(frame, [0, fade], [0, 1], {extrapolateRight: 'clamp'}),
        interpolate(frame, [durationInFrames - fade, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
        }),
      )
    : 1

  return (
    <div style={{width: '100%', height: '100%', background: bg, position: 'relative', overflow: 'hidden'}}>
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: pad,
          opacity,
          fontFamily: theme.font.sans,
          color: theme.text,
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const CHROME_TOP = 86 // 42 tab strip + 43 nav row + 1 rule

/**
 * A Chrome window, drawn so it actually reads as one — a tab strip with a live
 * tab, a nav row with back/forward/reload, an omnibox with a padlock, and the
 * extension row on the right where Chrome really puts it. The whole point of the
 * clips is that this is happening on a REAL website in a REAL browser.
 */
export const BrowserFrame: React.FC<{
  url: string
  children: React.ReactNode
  style?: React.CSSProperties
  /** Light the SVG Downloader button — the extension is armed on this tab. */
  active?: boolean
  /** Pulse ring around the extension button, 0..1 — drive it from the frame. */
  pulse?: number
  title?: string
}> = ({url, children, style, active, pulse = 0, title}) => {
  const tabTitle = title ?? url.replace(/^https?:\/\//, '').split('/')[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        boxShadow: theme.shadow.lift,
        border: `1px solid ${theme.line}`,
        ...style,
      }}
    >
      {/* Tab strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '9px 12px 0',
          background: '#dee1e6',
          flexShrink: 0,
          height: 42,
          boxSizing: 'border-box',
        }}
      >
        <div style={{display: 'flex', gap: 7, alignItems: 'center', paddingBottom: 10}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{width: 11, height: 11, borderRadius: 999, background: c}} />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginLeft: 8,
            padding: '0 12px',
            height: 33,
            minWidth: 210,
            background: theme.panel,
            borderRadius: '9px 9px 0 0',
            fontSize: 12.5,
            color: theme.text,
          }}
        >
          <div style={{width: 13, height: 13, borderRadius: 3, background: '#0a0a0a', flexShrink: 0}} />
          <span style={{flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {tabTitle}
          </span>
          <span style={{color: theme.dim2, fontSize: 14, lineHeight: 1}}>×</span>
        </div>

        <span style={{color: theme.dim2, fontSize: 16, paddingBottom: 8}}>+</span>
      </div>

      {/* Nav row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 12px',
          height: 43,
          background: theme.panel,
          borderBottom: `1px solid ${theme.line}`,
          flexShrink: 0,
        }}
      >
        <NavGlyph d="M15 5 L8 12 L15 19" />
        <NavGlyph d="M9 5 L16 12 L9 19" dim />
        <NavGlyph d="M19 12 a7 7 0 1 1 -2.5 -5.4 M17 3.5 V7 H13.5" dim />

        <div
          style={{
            flex: 1,
            height: 30,
            maxWidth: 640,
            borderRadius: 999,
            background: '#f1f3f4',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            fontSize: 13,
            color: theme.dim,
            fontFamily: theme.font.sans,
          }}
        >
          <svg width={11} height={13} viewBox="0 0 11 13" fill="none" style={{flexShrink: 0}}>
            <rect x="1" y="5.5" width="9" height="7" rx="1.6" fill={theme.dim} />
            <path d="M3 5.5 V3.6 a2.5 2.5 0 0 1 5 0 V5.5" stroke={theme.dim} strokeWidth="1.4" fill="none" />
          </svg>
          {url}
        </div>

        <div style={{flex: 1}} />

        {/* The extensions row — a puzzle piece, then the SVG Downloader mark. */}
        <svg width={18} height={18} viewBox="0 0 24 24" style={{flexShrink: 0}}>
          <path
            d="M10 3a2 2 0 0 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 0 1 0 4h-1v3a1 1 0 0 1-1 1h-3v1a2 2 0 0 1-4 0v-1H7a1 1 0 0 1-1-1v-3H5a2 2 0 0 1 0-4h1V5a1 1 0 0 1 1-1h3z"
            fill="none"
            stroke={theme.dim2}
            strokeWidth="1.6"
          />
        </svg>

        <div
          style={{
            position: 'relative',
            width: 28,
            height: 28,
            borderRadius: 8,
            display: 'grid',
            placeItems: 'center',
            background: active ? 'rgba(10,10,10,0.06)' : 'transparent',
            boxShadow: active ? `0 0 0 1.5px ${theme.text}` : 'none',
            flexShrink: 0,
          }}
        >
          {pulse > 0 ? (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                boxShadow: `0 0 0 ${pulse * 8}px rgba(10,10,10,${0.28 * (1 - pulse)})`,
              }}
            />
          ) : null}
          <ExtMark size={19} radius={5} />
        </div>
      </div>

      {/* The page. */}
      <div style={{flex: 1, position: 'relative', overflow: 'hidden'}}>{children}</div>
    </div>
  )
}

const NavGlyph: React.FC<{d: string; dim?: boolean}> = ({d, dim}) => (
  <svg width={18} height={18} viewBox="0 0 24 24" style={{flexShrink: 0}}>
    <path
      d={d}
      fill="none"
      stroke={dim ? theme.dim2 : theme.dim}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
