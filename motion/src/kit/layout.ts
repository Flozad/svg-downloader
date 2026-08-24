// Where everything sits on the 1280 × 800 canvas, in one place.
//
// The promo and every tutorial drive a cursor to real controls, so the hit
// points have to agree with the popup's actual box model or the pointer lands
// next to the button it is supposed to press. These offsets are derived from
// extension/popup.css, walked top-down:
//
//   header      12 + 28 + 12 + 1 border               = 53
//   body pad    14
//   mount       190                     →  67 …  257
//   gap         12
//   pager       9 + 18 + 9              → 269 …  305
//   gap         12
//   format      2 + 1 + 28.5 + 1 + 2    → 317 …  351
//   gap         12
//   field       15 + 6 + 38.75          → 363 …  423
//   gap         12
//   actions     36 + 8 + 38             → 435 …  517
//   gap         12
//   copy row    33.25                   → 529 …  562
//
// The status line and the colour hand-off sit BELOW all of that, so a status
// message appearing never moves a control — every hit point here stays valid
// whatever the popup is saying.

import {POPUP_W} from './Popup'

export const CANVAS = {width: 1280, height: 800} as const

/** The window. Deep enough that the ~672px popup never hangs off the canvas. */
export const BROWSER = {left: 40, top: 18, w: 1200, h: 764} as const

/** The toolbar's SVG Downloader button — where Chrome really puts it. */
export const EXT = {x: BROWSER.left + BROWSER.w - 26, y: BROWSER.top + 42 + 21} as const

/** The popup, anchored under that button and four px inside the window. */
export const P_LEFT = BROWSER.left + BROWSER.w - POPUP_W - 4 // 876
export const P_TOP = BROWSER.top + 86 + 6 // 110

const at = (dx: number, dy: number) => ({x: P_LEFT + dx, y: P_TOP + dy})

/** Control centres, in canvas coordinates. */
export const HIT = {
  ext: {x: EXT.x, y: EXT.y},
  preview: at(180, 162),
  prev: at(79, 287),
  next: at(281, 287),
  // Segment centres for the SVG state (the full-width segment). That is the
  // correct target: the pointer arrives BEFORE the click, while the size
  // selector that narrows the row does not exist yet.
  fmtSvg: at(71, 334),
  fmtPng: at(180, 334),
  fmtJpg: at(289, 334),
  filename: at(180, 404),
  download: at(180, 453),
  zip: at(180, 498),
  copyCode: at(95, 546),
  copyImage: at(265, 546),
} as const

/** A few resting places out on the page, for the browsing beats. */
export const PAGE_SPOTS = {
  gridTopLeft: {x: 320, y: 420},
  gridMid: {x: 560, y: 520},
  gridRight: {x: 730, y: 430},
  hero: {x: 380, y: 330},
  logo: {x: 108, y: 122},
} as const
