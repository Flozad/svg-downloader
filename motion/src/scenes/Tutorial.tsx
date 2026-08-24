import React from 'react'
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion'
import {BrandCard} from '../kit/Brand'
import {BrowserFrame, Stage} from '../kit/Chrome'
import {ContextMenu} from '../kit/ContextMenu'
import {Cursor} from '../kit/Cursor'
import {ICONS} from '../kit/icons'
import {IconPage} from '../kit/IconPage'
import {BROWSER, HIT, P_LEFT, PAGE_SPOTS, P_TOP} from '../kit/layout'
import {type Format, type Hot, Popup} from '../kit/Popup'
import {theme} from '../kit/theme'
import {type Click, type Move, useCursor} from '../kit/human'
import {TitleCard} from '../kit/TitleCard'

// One engine, fifteen tutorials.
//
// Each tutorial is a list of BEATS — "open the popup", "page to the star",
// "switch to PNG", "copy the code" — and this file turns that list into a
// finished recording: it lays the beats out on a clock, derives the pointer's
// waypoints and clicks from them, and derives the popup's state at any frame
// from the same list. Nothing is hand-timed twice, so a tutorial can be
// rewritten by editing its beats and nothing falls out of sync.
//
// The rule every beat obeys: it may only produce UI the extension actually has.
// A single download writes nothing into the popup's status line, so that beat
// raises Chrome's downloads tray instead of inventing a confirmation.

export type Beat =
  /** Cursor drifts over the page — the "here is a page with vectors on it" beat. */
  | {kind: 'browse'; caption: string; dur?: number}
  /** Click the toolbar button; the popup drops and the counter scans up. */
  | {kind: 'open'; caption: string; dur?: number}
  /** Walk the preview to a given index with Next (or Prev, if it is behind). */
  | {kind: 'page'; caption: string; to: number; dur?: number}
  /** Click a format in the SVG · PNG · JPG segment. */
  | {kind: 'format'; caption: string; to: Format; dur?: number}
  /** Type a filename into the field. */
  | {kind: 'name'; caption: string; text: string; dur?: number}
  /** Download current → Chrome's downloads tray appears. */
  | {kind: 'download'; caption: string; dur?: number}
  /** Download all as ZIP → the real status line. */
  | {kind: 'zip'; caption: string; dur?: number}
  /** Copy code / Copy image → the real status line. */
  | {kind: 'copy'; caption: string; what: 'code' | 'image'; dur?: number}
  /** Right-click an icon on the page and take "Save this as SVG". */
  | {kind: 'rightClick'; caption: string; dur?: number}
  /** Hold on the current state with a caption — for an explanation. */
  | {kind: 'hold'; caption: string; dur?: number}

export type TutorialSpec = {
  /** Composition id, and the output filename. */
  id: string
  /** The title card. */
  eyebrow: string
  title: string
  /** The site the recording is pointed at. */
  url?: string
  siteTitle?: string
  /** How many SVGs the scan reports. Defaults to the page's real 24. */
  count?: number
  beats: Beat[]
}

const DEFAULT_DUR: Record<Beat['kind'], number> = {
  browse: 2.4,
  open: 3.4,
  page: 2.0,
  format: 1.8,
  name: 2.6,
  download: 2.4,
  zip: 2.6,
  copy: 2.4,
  rightClick: 4.0,
  hold: 2.2,
}

export const INTRO = 2.0
export const OUTRO = 2.4

type Placed = {beat: Beat; start: number; end: number}

const place = (beats: Beat[]): {placed: Placed[]; bodyEnd: number} => {
  let t = INTRO
  const placed = beats.map((beat) => {
    const dur = beat.dur ?? DEFAULT_DUR[beat.kind]
    const start = t
    t += dur
    return {beat, start, end: t}
  })
  return {placed, bodyEnd: t}
}

/** Total runtime of a spec, in seconds — Root needs it to size the composition. */
export const tutorialSeconds = (spec: TutorialSpec): number => place(spec.beats).bodyEnd + OUTRO

const between = (t: number, a: number, b: number) => t >= a && t <= b

const ramp = (t: number, a: number, b: number) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

const edgeFade = (t: number, a: number, b: number, r = 0.3) =>
  Math.min(ramp(t, a, a + r), 1 - ramp(t, b - r, b))

/** Where on the page the right-click beat aims — the star card in the grid. */
const RIGHT_CLICK_TARGET = {x: 596, y: 404}

export const Tutorial: React.FC<{spec: TutorialSpec}> = ({spec}) => {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const t = frame / fps

  const total = spec.count ?? ICONS.length
  const {placed, bodyEnd} = place(spec.beats)

  // ── Compile the beats into pointer waypoints and clicks ──────────────────
  const moves: Move[] = [{t: 0, ...PAGE_SPOTS.gridMid}]
  const clicks: Click[] = []
  let cursorIndex = 0 // preview index as the COMPILER walks forward

  for (const {beat, start, end} of placed) {
    const b = beat
    switch (b.kind) {
      case 'browse':
        moves.push({t: start + 0.1, ...PAGE_SPOTS.gridTopLeft})
        moves.push({t: start + (end - start) * 0.55, ...PAGE_SPOTS.gridRight})
        break

      case 'open':
        moves.push({t: start + 0.15, ...HIT.ext, dur: 0.65})
        clicks.push({t: start + 1.0})
        moves.push({t: start + 1.7, ...HIT.preview, dur: 0.6})
        break

      case 'page': {
        const steps = Math.abs(b.to - cursorIndex)
        const target = b.to > cursorIndex ? HIT.next : HIT.prev
        moves.push({t: start + 0.15, ...target, dur: 0.55})
        const span = (end - start) - 0.9
        for (let i = 0; i < steps; i++) {
          clicks.push({t: start + 0.85 + (span * i) / Math.max(1, steps)})
        }
        cursorIndex = b.to
        break
      }

      case 'format': {
        const target = b.to === 'png' ? HIT.fmtPng : b.to === 'jpg' ? HIT.fmtJpg : HIT.fmtSvg
        moves.push({t: start + 0.15, ...target, dur: 0.55})
        clicks.push({t: start + 0.85})
        break
      }

      case 'name':
        moves.push({t: start + 0.15, ...HIT.filename, dur: 0.55})
        clicks.push({t: start + 0.8})
        break

      case 'download':
        moves.push({t: start + 0.15, ...HIT.download, dur: 0.55})
        clicks.push({t: start + 0.9})
        break

      case 'zip':
        moves.push({t: start + 0.15, ...HIT.zip, dur: 0.55})
        clicks.push({t: start + 0.9})
        break

      case 'copy':
        moves.push({t: start + 0.15, ...(b.what === 'code' ? HIT.copyCode : HIT.copyImage), dur: 0.55})
        clicks.push({t: start + 0.9})
        break

      case 'rightClick':
        moves.push({t: start + 0.15, ...RIGHT_CLICK_TARGET, dur: 0.6})
        clicks.push({t: start + 0.9, hold: 0.14})
        // Down the menu to the extension's row, then take it.
        moves.push({t: start + 1.9, x: RIGHT_CLICK_TARGET.x + 96, y: RIGHT_CLICK_TARGET.y + 168, dur: 0.6})
        clicks.push({t: start + 2.8})
        break

      case 'hold':
        break
    }
  }

  // Park the pointer off the controls for the outro.
  moves.push({t: bodyEnd - 0.2, ...PAGE_SPOTS.gridMid, dur: 0.8})

  const cursor = useCursor(moves, clicks)

  // ── Derive the popup's state at time t from the same beats ───────────────
  let popupOpenAt: number | null = null
  let index = 0
  let format: Format = 'svg'
  let filename = ''
  let hot: Hot = null
  let pressed = false
  let status: string | undefined
  let downloadTray = 0
  let menu: {open: number; hot: boolean} | null = null
  let caret = false
  let extPulse = 0
  let caption: string | undefined

  for (const {beat, start, end} of placed) {
    const b = beat
    const active = between(t, start, end)
    if (active && b.caption) caption = b.caption

    switch (b.kind) {
      case 'open':
        if (active && t < start + 1.0) extPulse = ((t - start) / 0.7) % 1
        if (t >= start + 1.05) popupOpenAt = start + 1.05
        if (active) {
          if (between(t, start + 0.15, start + 1.05)) hot = 'refresh'
          if (between(t, start + 1.0, start + 1.09)) pressed = true
        }
        break

      case 'page': {
        // `index` still holds where the previous beat left the preview, so the
        // walk is: step it once per click that has already landed.
        const from = index
        const dir = b.to >= from ? 1 : -1
        const steps = Math.abs(b.to - from)
        const span = (end - start) - 0.9
        if (t >= end) {
          index = b.to
          break
        }
        if (active) {
          let landed = 0
          for (let i = 0; i < steps; i++) {
            const ct = start + 0.85 + (span * i) / Math.max(1, steps)
            if (t >= ct) landed++
            if (between(t, ct, ct + 0.11)) pressed = true
          }
          index = from + dir * landed
          hot = dir > 0 ? 'next' : 'prev'
        }
        break
      }

      case 'format':
        if (t >= start + 0.85) format = b.to
        if (active) {
          hot = b.to
          if (between(t, start + 0.85, start + 0.96)) pressed = true
        }
        break

      case 'name':
        if (active && t >= start + 0.9) {
          const p = ramp(t, start + 0.95, end - 0.5)
          filename = b.text.slice(0, Math.round(p * b.text.length))
          caret = true
        } else if (t >= end) {
          filename = b.text
        }
        break

      case 'download':
        if (active) {
          hot = 'download'
          if (between(t, start + 0.9, start + 1.01)) pressed = true
        }
        if (t >= start + 1.0) downloadTray = ramp(t, start + 1.0, start + 1.4)
        break

      case 'zip':
        if (active) {
          hot = 'zip'
          if (between(t, start + 0.9, start + 1.01)) pressed = true
        }
        // Verbatim from popup.js.
        if (t >= start + 1.15) status = `Downloaded ${total} SVGs as ZIP.`
        break

      case 'copy':
        if (active) {
          hot = b.what === 'code' ? 'copyCode' : 'copyImage'
          if (between(t, start + 0.9, start + 1.01)) pressed = true
        }
        // Verbatim from popup.js.
        if (t >= start + 1.1) {
          status = b.what === 'code' ? 'SVG code copied to clipboard.' : 'PNG image copied to clipboard.'
        }
        break

      case 'rightClick':
        if (between(t, start + 0.95, start + 2.9)) {
          menu = {open: ramp(t, start + 0.95, start + 1.12), hot: t >= start + 2.35}
        }
        if (t >= start + 2.9) downloadTray = ramp(t, start + 2.9, start + 3.3)
        break

      default:
        break
    }
  }

  // Index can only be read after the whole walk, so clamp it once at the end.
  index = Math.max(0, Math.min(total - 1, index))

  const popupOpen = popupOpenAt !== null
  const popupProgress = popupOpen ? ramp(t, popupOpenAt as number, (popupOpenAt as number) + 0.45) : 0
  const count = popupOpen
    ? Math.round(ramp(t, (popupOpenAt as number) + 0.15, (popupOpenAt as number) + 1.2) * total)
    : 0
  const refreshSpin = popupOpen ? ramp(t, popupOpenAt as number, (popupOpenAt as number) + 1.2) : 0
  const preview = popupOpen ? ramp(t, (popupOpenAt as number) + 0.9, (popupOpenAt as number) + 1.25) : 0

  const intro = 1 - ramp(t, INTRO - 0.5, INTRO)
  const outro = ramp(t, bodyEnd, bodyEnd + 0.9)
  const name = ICONS[index % ICONS.length].name

  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0}}>
        {/* The browser, and the page it is showing. */}
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
            url={spec.url ?? 'vectorly.io/icons'}
            title={spec.siteTitle ?? 'Vectorly — 3,400 free line icons'}
            active={popupOpen}
            pulse={extPulse}
            downloadTray={downloadTray}
            style={{width: '100%', height: '100%'}}
          >
            <IconPage lit={popupOpen && preview > 0.4 ? index : undefined} />
          </BrowserFrame>
        </div>

        {/* Chrome's right-click menu, when a beat opened one. */}
        {menu ? (
          <div
            style={{
              position: 'absolute',
              left: RIGHT_CLICK_TARGET.x,
              top: RIGHT_CLICK_TARGET.y,
              zIndex: 45,
            }}
          >
            <ContextMenu progress={menu.open} hot={menu.hot} />
          </div>
        ) : null}

        {/* The popup, anchored under its toolbar button. */}
        {popupOpen ? (
          <div style={{position: 'absolute', left: P_LEFT, top: P_TOP, zIndex: 40}}>
            <Popup
              count={count}
              index={index}
              total={total}
              filename={filename || name}
              caret={caret}
              preview={preview}
              hot={hot}
              pressed={pressed}
              status={status}
              format={format}
              progress={popupProgress}
              refreshSpin={refreshSpin}
            />
          </div>
        ) : null}

        {/* Lower-third caption — the explanation track. */}
        {caption ? (
          <Lower text={caption} opacity={(1 - intro) * (1 - outro)} />
        ) : null}

        {/* The pointer lives in canvas coordinates, above everything. */}
        {intro < 0.15 && outro < 0.2 ? <Cursor {...cursor} /> : null}

        {/* Title card in, brand card out. */}
        {intro > 0 ? (
          <div style={{position: 'absolute', inset: 0, opacity: intro, zIndex: 70}}>
            <TitleCard eyebrow={spec.eyebrow} title={spec.title} />
          </div>
        ) : null}
        {outro > 0 ? (
          <div style={{position: 'absolute', inset: 0, opacity: outro, zIndex: 70}}>
            <BrandCard progress={ramp(t, bodyEnd + 0.2, bodyEnd + 1.4)} />
          </div>
        ) : null}
      </div>
    </Stage>
  )
}

/** The caption band. Mono, because it is the technical voice, not a slogan. */
const Lower: React.FC<{text: string; opacity: number}> = ({text, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: '50%',
      bottom: 20,
      transform: 'translateX(-50%)',
      opacity,
      padding: '10px 22px',
      borderRadius: theme.radius.pill,
      background: theme.surfaceHi,
      border: `1px solid ${theme.line2}`,
      boxShadow: theme.shadow.pop,
      fontFamily: theme.font.mono,
      fontSize: 15,
      letterSpacing: '0.01em',
      color: theme.ink,
      whiteSpace: 'nowrap',
      zIndex: 50,
    }}
  >
    {text}
  </div>
)

// `edgeFade` is exported for scenes that want their own caption ramps.
export {edgeFade}
