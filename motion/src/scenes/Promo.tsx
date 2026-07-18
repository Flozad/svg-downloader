import React from 'react'
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion'
import {BrandCard} from '../kit/Brand'
import {BrowserFrame, Stage} from '../kit/Chrome'
import {Cursor} from '../kit/Cursor'
import {ICONS} from '../kit/icons'
import {IconPage} from '../kit/IconPage'
import {Popup} from '../kit/Popup'
import {theme} from '../kit/theme'
import {useCursor} from '../kit/human'

// The promo. One continuous session on one real page, in six beats, 24 seconds:
//
//   0.0–3.6   browse   — an icon library, cursor drifting; then to the ext icon
//   3.6–4.0   open     — a click; the popup drops from the toolbar
//   4.0–7.0   detect   — "0 → 24 SVGs found" as it scans, the first preview pops
//   7.0–12.8  page     — Next, Next: the preview walks the detected SVGs
//   12.8–16.2 download — "Download Current SVG", and a saved tick
//   16.2–18.8 zip      — "Download All as ZIP", 24 saved at once
//   18.8–24   brand    — the mark, the name, the promise
//
// The browser is the spine: it never unmounts. Everything the extension draws
// (the popup) sits ON it in canvas coordinates, so nothing can escape the frame.

const BROWSER = {left: 40, top: 30, w: 1200, h: 690}
const EXT = {x: BROWSER.left + BROWSER.w - 26, y: BROWSER.top + 42 + 21} // 1214, 93
const P_TOP = BROWSER.top + 86 + 6 // 122
const P_LEFT = 876 // right edge ≈ 1236

// Button centres in canvas coordinates (derived from the popup's own layout).
const HIT = {
  ext: {x: EXT.x, y: EXT.y},
  preview: {x: P_LEFT + 180, y: P_TOP + 171},
  next: {x: P_LEFT + 360 - 16 - 33, y: P_TOP + 304},
  download: {x: P_LEFT + 180, y: P_TOP + 425},
  zip: {x: P_LEFT + 180, y: P_TOP + 467},
}

// The SVGs the preview walks, by ICONS index: search → heart → star.
const PAGES = [
  {t: 4.0, i: 0},
  {t: 8.0, i: 1},
  {t: 9.8, i: 2},
]

const between = (t: number, a: number, b: number) => t >= a && t <= b
const edgeFade = (t: number, a: number, b: number, ramp = 0.3) =>
  Math.min(
    interpolate(t, [a, a + ramp], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(t, [b - ramp, b], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  )

const CAPTIONS: {a: number; b: number; text: string}[] = [
  {a: 1.0, b: 3.4, text: 'Browsing an icon-packed page'},
  {a: 4.2, b: 6.9, text: 'Every SVG on the page — detected'},
  {a: 7.2, b: 12.6, text: 'Preview and page through each one'},
  {a: 13.0, b: 16.0, text: 'Download the original SVG in one click'},
  {a: 16.4, b: 18.6, text: 'Or grab them all as a ZIP'},
]

export const Promo: React.FC = () => {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const t = frame / fps

  const cursor = useCursor(
    [
      {t: 0, x: 420, y: 520},
      {t: 0.9, x: 640, y: 430},
      {t: 2.0, x: 900, y: 300},
      {t: 2.7, x: HIT.ext.x, y: HIT.ext.y, dur: 0.7},
      {t: 4.2, x: HIT.preview.x, y: HIT.preview.y, dur: 0.6},
      {t: 7.3, x: HIT.next.x, y: HIT.next.y, dur: 0.6},
      {t: 9.5, x: HIT.next.x - 3, y: HIT.next.y + 2, dur: 0.3},
      {t: 12.7, x: HIT.download.x, y: HIT.download.y, dur: 0.6},
      {t: 15.7, x: HIT.zip.x, y: HIT.zip.y, dur: 0.5},
      {t: 18.4, x: 980, y: 660, dur: 0.8},
    ],
    [
      {t: 3.6},
      {t: 8.0},
      {t: 9.8},
      {t: 14.0},
      {t: 16.4},
    ],
  )

  // Popup entrance — springs open just after the click.
  const popupProgress = interpolate(t, [3.7, 4.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (x) => 1 - (1 - x) * (1 - x),
  })
  const popupOpen = t >= 3.65

  // The counter scanning up, and the refresh glyph turning while it does.
  const count = Math.round(interpolate(t, [4.1, 5.2], [0, 24], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))
  const refreshSpin = interpolate(t, [4.0, 5.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  // Which SVG the preview shows, and its little re-pop on each change.
  const page = [...PAGES].reverse().find((p) => t >= p.t) ?? PAGES[0]
  const index = page.i
  const preview = interpolate(t - page.t, [0, 0.35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const name = ICONS[index].name

  // Which control is hot / pressed.
  let hot: 'refresh' | 'prev' | 'next' | 'download' | 'zip' | null = null
  if (between(t, 7.3, 10.2)) hot = 'next'
  else if (between(t, 12.7, 15.7)) hot = 'download'
  else if (between(t, 15.7, 18.4)) hot = 'zip'
  const pressed =
    between(t, 8.0, 8.13) || between(t, 9.8, 9.93) || between(t, 14.0, 14.15) || between(t, 16.4, 16.55)

  // The saved confirmations.
  let toast: string | undefined
  if (between(t, 14.2, 16.2)) toast = `Saved ${name}.svg`
  else if (between(t, 16.6, 18.6)) toast = '24 SVGs saved'

  // The extension button: armed once the popup is up; a ripple as the cursor
  // arrives, just before the click.
  const extPulse = between(t, 2.9, 3.6) ? ((t - 2.9) / 0.7) % 1 : 0

  // The brand card rising over the finish.
  const brand = interpolate(t, [18.8, 20.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
  const brandProgress = interpolate(t, [19.1, 20.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  const litIcon = popupOpen && t > 4.3 ? index : undefined
  const caption = CAPTIONS.find((c) => between(t, c.a, c.b))

  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0}}>
        {/* The browser and the page it's showing. */}
        <div
          style={{
            position: 'absolute',
            left: BROWSER.left,
            top: BROWSER.top,
            width: BROWSER.w,
            height: BROWSER.h,
          }}
        >
          <BrowserFrame
            url="vectorly.io/icons"
            title="Vectorly — 3,400 free line icons"
            active={popupOpen}
            pulse={extPulse}
            style={{width: '100%', height: '100%'}}
          >
            <IconPage lit={litIcon} />
          </BrowserFrame>
        </div>

        {/* The popup — drawn on the page, anchored under its toolbar button. */}
        {popupOpen ? (
          <div style={{position: 'absolute', left: P_LEFT, top: P_TOP, zIndex: 40}}>
            <Popup
              count={count}
              index={index}
              total={ICONS.length}
              filename={`${name}-24`}
              preview={preview}
              hot={hot}
              pressed={pressed}
              toast={toast}
              progress={popupProgress}
              refreshSpin={refreshSpin}
            />
          </div>
        ) : null}

        {/* Lower-third caption. */}
        {caption ? (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 22,
              transform: 'translateX(-50%)',
              opacity: edgeFade(t, caption.a, caption.b, 0.35) * (1 - brand),
              padding: '10px 20px',
              borderRadius: 999,
              background: '#fff',
              boxShadow: theme.shadow.pop,
              fontSize: 17,
              fontWeight: 600,
              color: theme.text,
              whiteSpace: 'nowrap',
              zIndex: 50,
            }}
          >
            {caption.text}
          </div>
        ) : null}

        {/* The cursor lives in canvas coordinates, above everything. */}
        {t < 19.2 ? <Cursor {...cursor} /> : null}

        {/* The brand card, rising over the finish. */}
        {brand > 0 ? (
          <div style={{position: 'absolute', inset: 0, opacity: brand, zIndex: 60}}>
            <BrandCard progress={brandProgress} />
          </div>
        ) : null}
      </div>
    </Stage>
  )
}
