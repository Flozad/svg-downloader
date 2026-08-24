import React from 'react'
import {useBrandFonts} from '../kit/fonts'
import {ExtMark, ICONS} from '../kit/icons'
import {Popup} from '../kit/Popup'
import {SHEET, theme} from '../kit/theme'

// The two Chrome Web Store promo tiles. Both are pure brand — the mark, the
// name, the promise — on the product's ruled bone stock, in the display face
// with the plotter green as the only colour. Rendered as stills.

/** Small promo tile — 440 × 280. Exact size the store's "Small tile" slot wants. */
export const PromoTile: React.FC = () => {
  // These tiles do not sit in <Stage>, which is what normally blocks a frame
  // until Bricolage and Space Mono are ready. Without this the wordmark renders
  // in the fallback sans — visibly a different product from every other asset.
  useBrandFonts()
  return (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: theme.paper,
      ...SHEET,
      overflow: 'hidden',
      fontFamily: theme.font.sans,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      textAlign: 'center',
      padding: 24,
      boxSizing: 'border-box',
    }}
  >
    <IconStrip />
    <div style={{borderRadius: 15, boxShadow: '0 16px 40px -18px rgba(27,26,21,0.5)', zIndex: 1}}>
      <ExtMark size={68} radius={16} />
    </div>
    <div style={{zIndex: 1}}>
      <div
        style={{
          fontFamily: theme.font.display,
          fontVariationSettings: '"opsz" 26, "wght" 700',
          fontSize: 24,
          letterSpacing: '-0.035em',
          color: theme.ink,
          lineHeight: 1.1,
        }}
      >
        SVG Downloader
        <br />
        <span style={{color: theme.plot}}>&amp; Extractor</span>
      </div>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 10.5,
          letterSpacing: '0.02em',
          color: theme.dim,
          marginTop: 10,
        }}
      >
        Extract &amp; download any SVG from any site
      </div>
    </div>
  </div>
  )
}

const IconStrip: React.FC = () => {
  const picks = [0, 1, 2, 3, 5, 9, 18, 22]
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none'}}>
      {picks.map((p, i) => (
        <div
          key={p}
          style={{
            position: 'absolute',
            left: `${8 + (i % 4) * 28}%`,
            top: i < 4 ? '14%' : '82%',
            width: 40,
            height: 40,
            transform: 'translate(-50%, -50%)',
            color: theme.ink,
          }}
        >
          {ICONS[p].node(theme.ink)}
        </div>
      ))}
    </div>
  )
}

/** Marquee promo tile — 1400 × 560. Brand block left, a live popup right. */
export const Marquee: React.FC = () => {
  useBrandFonts()
  return (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: theme.paper,
      ...SHEET,
      overflow: 'hidden',
      fontFamily: theme.font.sans,
      display: 'flex',
      alignItems: 'center',
    }}
  >
    {/* faint icon field across the whole tile */}
    <div style={{position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none'}}>
      {ICONS.slice(0, 16).map((ic, i) => (
        <div
          key={ic.name}
          style={{
            position: 'absolute',
            left: `${6 + (i % 8) * 12}%`,
            top: i < 8 ? '12%' : '80%',
            width: 46,
            height: 46,
            transform: 'translate(-50%, -50%)',
            color: theme.ink,
          }}
        >
          {ic.node(theme.ink)}
        </div>
      ))}
    </div>

    {/* left — the brand block */}
    <div style={{flex: 1, padding: '0 40px 0 84px', zIndex: 1}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 26}}>
        <div style={{borderRadius: 16, boxShadow: '0 16px 40px -18px rgba(27,26,21,0.5)'}}>
          <ExtMark size={72} radius={17} />
        </div>
      </div>
      <div
        style={{
          fontFamily: theme.font.display,
          fontVariationSettings: '"opsz" 56, "wght" 700',
          fontSize: 52,
          letterSpacing: '-0.04em',
          color: theme.ink,
          lineHeight: 1.05,
        }}
      >
        SVG Downloader
        <br />
        <span style={{color: theme.dim}}>&amp; Extractor</span>
      </div>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 16,
          letterSpacing: '0.02em',
          lineHeight: 1.5,
          color: theme.dim,
          marginTop: 18,
          maxWidth: 520,
        }}
      >
        Extract &amp; download any SVG from any website — icons, logos and vectors,
        in original quality.
      </div>
    </div>

    {/* right — the popup, tilted into the frame */}
    <div style={{width: 560, position: 'relative', height: '100%', zIndex: 1}}>
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: '50%',
          transform: 'translateY(-50%) scale(1.02)',
          filter: 'drop-shadow(0 30px 60px rgba(10,10,10,0.28))',
        }}
      >
        <Popup count={24} index={2} total={ICONS.length} filename="star" progress={1} />
      </div>
    </div>
  </div>
  )
}
