import React from 'react'
import {ExtMark, ICONS} from './icons'
import {SHEET, theme} from './theme'

/**
 * The closing brand card, and the same block the store tiles are built from: the
 * extension mark, the full name, and the one-line promise — set on ruled bone
 * stock in the display face, with the plotter green as the only colour. Centred
 * and quiet: the product's own voice.
 */
export const BrandCard: React.FC<{
  progress?: number
  markSize?: number
  titleSize?: number
  tagSize?: number
  showFaintIcons?: boolean
}> = ({progress = 1, markSize = 96, titleSize = 46, tagSize = 20, showFaintIcons = true}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      background: theme.paper,
      ...SHEET,
      overflow: 'hidden',
      fontFamily: theme.font.sans,
      textAlign: 'center',
    }}
  >
    {showFaintIcons ? <FaintIconField /> : null}

    <div
      style={{
        borderRadius: markSize * 0.22,
        boxShadow: '0 24px 60px -24px rgba(27,26,21,0.5)',
        transform: `scale(${0.85 + Math.min(1, progress) * 0.15})`,
        opacity: Math.min(1, progress * 1.5),
        zIndex: 1,
      }}
    >
      <ExtMark size={markSize} radius={markSize * 0.22} />
    </div>

    <div style={{zIndex: 1, transform: `translateY(${(1 - Math.min(1, progress)) * 10}px)`, opacity: Math.min(1, progress * 1.6)}}>
      <div
        style={{
          fontFamily: theme.font.display,
          fontVariationSettings: '"opsz" 44, "wght" 700',
          fontSize: titleSize,
          letterSpacing: '-0.035em',
          color: theme.ink,
        }}
      >
        SVG Downloader <span style={{color: theme.plot}}>&amp;</span> Extractor
      </div>
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: tagSize * 0.78,
          letterSpacing: '0.04em',
          color: theme.dim,
          marginTop: 14,
        }}
      >
        Extract &amp; download any SVG from any website.
      </div>
    </div>
  </div>
)

/** A faint scatter of the library's icons behind the mark — texture, not content. */
const FaintIconField: React.FC = () => {
  const picks = [1, 2, 3, 4, 5, 6, 9, 10, 11, 18, 19, 22]
  const spots = [
    [8, 16], [24, 70], [16, 42], [40, 20], [58, 74], [72, 30],
    [88, 62], [82, 14], [36, 84], [64, 46], [12, 80], [92, 40],
  ]
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none'}}>
      {spots.map(([left, top], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: 44,
            height: 44,
            transform: 'translate(-50%, -50%)',
            color: theme.ink,
          }}
        >
          {ICONS[picks[i % picks.length]].node(theme.ink)}
        </div>
      ))}
    </div>
  )
}

/**
 * The caption band the screenshots carry — a numbered eyebrow, a headline, and a
 * one-line benefit under it. Baked into the still, matching the store's style.
 */
export const Caption: React.FC<{
  eyebrow?: string
  title: string
  sub?: string
  style?: React.CSSProperties
}> = ({eyebrow, title, sub, style}) => (
  <div style={{textAlign: 'center', ...style}}>
    {eyebrow ? (
      <div
        style={{
          fontFamily: theme.font.mono,
          fontSize: 13,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: theme.plot,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
    ) : null}
    <div
      style={{
        fontFamily: theme.font.display,
        fontVariationSettings: '"opsz" 40, "wght" 700',
        fontSize: 38,
        letterSpacing: '-0.035em',
        color: theme.ink,
        lineHeight: 1.1,
      }}
    >
      {title}
    </div>
    {sub ? (
      <div style={{fontFamily: theme.font.mono, fontSize: 14.5, letterSpacing: '0.02em', color: theme.dim, marginTop: 12}}>
        {sub}
      </div>
    ) : null}
  </div>
)
