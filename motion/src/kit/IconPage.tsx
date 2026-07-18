import React from 'react'
import {ICONS, SiteLogo} from './icons'
import {theme} from './theme'

/**
 * The website the recordings are pointed at: a plausible open-source icon
 * library — a wordmark, a hero line, and a grid of exactly 24 inline <svg>
 * icons. It is drawn so the popup's "24 SVGs found" is literally true of the
 * page beside it, which is the whole trick: the demo isn't claiming a count, the
 * count is just what's there.
 *
 * `lit` optionally raises one icon card (index into ICONS) — the one the popup is
 * previewing — so the eye can tie the big preview back to its source on the page.
 */
export const IconPage: React.FC<{lit?: number; style?: React.CSSProperties}> = ({lit, style}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#fff',
      fontFamily: theme.font.sans,
      display: 'flex',
      flexDirection: 'column',
      color: theme.ink,
      ...style,
    }}
  >
    {/* nav */}
    <div
      style={{
        height: 62,
        borderBottom: `1px solid ${theme.line}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        gap: 16,
        flexShrink: 0,
      }}
    >
      <SiteLogo size={26} />
      <span style={{fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em'}}>Vectorly</span>
      <div style={{flex: 1}} />
      {['Icons', 'Logos', 'Illustrations', 'Pricing'].map((t) => (
        <span key={t} style={{fontSize: 13.5, color: theme.dim, fontWeight: 500}}>
          {t}
        </span>
      ))}
      <div
        style={{
          marginLeft: 10,
          height: 34,
          padding: '0 18px',
          borderRadius: 8,
          background: '#0a0a0a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Get all icons
      </div>
    </div>

    {/* hero */}
    <div style={{padding: '30px 40px 20px', flexShrink: 0}}>
      <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: '#0a0a0a'}}>
        3,400 free line icons
      </div>
      <div style={{fontSize: 15, color: theme.dim, marginTop: 6}}>
        Hand-crafted SVGs for your next project — MIT licensed.
      </div>
    </div>

    {/* icon grid — 6 × 4 = 24 real inline SVGs */}
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 16,
        padding: '0 40px 34px',
        minHeight: 0,
      }}
    >
      {ICONS.map((ic, i) => {
        const on = i === lit
        return (
          <div
            key={ic.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderRadius: 12,
              border: `1px solid ${on ? theme.text : theme.line}`,
              background: on ? '#fafafa' : '#fff',
              boxShadow: on
                ? '0 10px 24px -12px rgba(10,10,10,0.35)'
                : '0 1px 2px rgba(10,10,10,0.03)',
              transform: on ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{width: 34, height: 34, color: '#0a0a0a'}}>{ic.node('#0a0a0a')}</div>
            <span style={{fontSize: 11.5, color: theme.dim, fontWeight: 500}}>{ic.name}</span>
          </div>
        )
      })}
    </div>
  </div>
)
