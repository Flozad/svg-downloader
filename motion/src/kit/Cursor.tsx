import React from 'react'
import type {CursorState} from './human'
import {theme} from './theme'

/**
 * The macOS pointer, drawn as vector so it stays crisp at any scale, plus the
 * click feedback. The ripple is the part that actually communicates "a person
 * clicked here" — without it, a viewer reads a UI change as an animation rather
 * than as a consequence. On this monochrome product the ripple is ink, not brand.
 */
export const Cursor: React.FC<CursorState & {scale?: number}> = ({
  x,
  y,
  pressed,
  ripples,
  scale = 1,
}) => (
  <>
    {ripples.map((r, i) => {
      const p = r.age / 0.6
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            borderRadius: 999,
            border: `2px solid ${theme.text}`,
            transform: `scale(${1 + p * 6})`,
            opacity: (1 - p) * 0.7,
            pointerEvents: 'none',
          }}
        />
      )
    })}

    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${scale * (pressed ? 0.86 : 1)})`,
        transformOrigin: '2px 2px',
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 5px rgba(10,10,10,0.35))',
        zIndex: 100,
      }}
    >
      <svg width={26} height={32} viewBox="0 0 26 32" fill="none">
        <path
          d="M2 1.5 L2 24 L7.6 18.9 L11.4 27.8 L15.4 26.1 L11.7 17.4 L19.5 17.1 Z"
          fill={theme.panel}
          stroke={theme.text}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </>
)
