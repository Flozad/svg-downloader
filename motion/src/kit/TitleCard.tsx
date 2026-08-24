import React from 'react'
import {ExtMark} from './icons'
import {SHEET, theme} from './theme'

/**
 * The two seconds that open every tutorial: what this one is about, set on the
 * same ruled bone stock as the rest of the product. Deliberately quiet — the
 * card is a label on a drawing, not a title sequence.
 *
 * The eyebrow carries the query the tutorial answers, so a viewer who arrived
 * from a search sees their own words in the first frame.
 */
export const TitleCard: React.FC<{eyebrow: string; title: string}> = ({eyebrow, title}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: theme.paper,
      ...SHEET,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 22,
      padding: '0 120px',
      boxSizing: 'border-box',
      textAlign: 'center',
    }}
  >
    <ExtMark size={62} radius={14} />

    <div
      style={{
        fontFamily: theme.font.mono,
        fontSize: 14,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: theme.plot,
      }}
    >
      {eyebrow}
    </div>

    <div
      style={{
        fontFamily: theme.font.display,
        fontVariationSettings: '"opsz" 48, "wght" 700',
        fontSize: 58,
        lineHeight: 1.06,
        letterSpacing: '-0.035em',
        color: theme.ink,
        maxWidth: 940,
      }}
    >
      {title}
    </div>

    <div
      style={{
        marginTop: 6,
        fontFamily: theme.font.mono,
        fontSize: 13,
        letterSpacing: '0.08em',
        color: theme.dim,
      }}
    >
      svg.clasicwebtools.com
    </div>
  </div>
)
