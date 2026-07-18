import React from 'react'
import {ExtMark, ICONS} from './icons'
import {theme} from './theme'

/**
 * The closing brand card, and the same block the store tiles are built from: the
 * extension mark, the full name, and the one-line promise. Monochrome, centred,
 * quiet — the product's own voice.
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
      background: theme.bg,
      overflow: 'hidden',
      fontFamily: theme.font.sans,
      textAlign: 'center',
    }}
  >
    {showFaintIcons ? <FaintIconField /> : null}

    <div
      style={{
        borderRadius: markSize * 0.22,
        boxShadow: '0 24px 60px -24px rgba(10,10,10,0.5)',
        transform: `scale(${0.85 + Math.min(1, progress) * 0.15})`,
        opacity: Math.min(1, progress * 1.5),
        zIndex: 1,
      }}
    >
      <ExtMark size={markSize} radius={markSize * 0.22} />
    </div>

    <div style={{zIndex: 1, transform: `translateY(${(1 - Math.min(1, progress)) * 10}px)`, opacity: Math.min(1, progress * 1.6)}}>
      <div style={{fontSize: titleSize, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text}}>
        SVG Downloader <span style={{color: theme.dim}}>&amp;</span> Extractor
      </div>
      <div style={{fontSize: tagSize, color: theme.dim, marginTop: 12, fontWeight: 500}}>
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
    <div style={{position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none'}}>
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
            color: '#0a0a0a',
          }}
        >
          {ICONS[picks[i % picks.length]].node('#0a0a0a')}
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
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: theme.dim2,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
    ) : null}
    <div style={{fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', color: theme.text, lineHeight: 1.1}}>
      {title}
    </div>
    {sub ? (
      <div style={{fontSize: 18, color: theme.dim, marginTop: 10, fontWeight: 500}}>{sub}</div>
    ) : null}
  </div>
)
