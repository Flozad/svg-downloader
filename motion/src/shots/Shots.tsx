import React from 'react'
import {BrandCard, Caption} from '../kit/Brand'
import {Stage} from '../kit/Chrome'
import {GROUP_H, GROUP_W, MockGroup} from '../kit/MockGroup'

// The Chrome Web Store screenshots, one composition each, 1280 × 800 — the
// store's preferred size. A caption band up top, the product frozen in one
// telling state below it. Rendered as stills, so any frame is the final frame.

const SCALE = 0.84
const GROUP_LEFT = (1280 - GROUP_W * SCALE) / 2
const GROUP_TOP = 196

const ShotFrame: React.FC<{
  eyebrow: string
  title: string
  sub: string
  popup: React.ComponentProps<typeof MockGroup>['popup']
  showPopup?: boolean
}> = ({eyebrow, title, sub, popup, showPopup}) => (
  <Stage fade={false}>
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', top: 54, left: 0, right: 0}}>
        <Caption eyebrow={eyebrow} title={title} sub={sub} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: GROUP_LEFT,
          top: GROUP_TOP,
          width: GROUP_W,
          height: GROUP_H,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
        }}
      >
        <MockGroup popup={popup} showPopup={showPopup} />
      </div>
    </div>
  </Stage>
)

/** 01 — the value prop: it finds them all. */
export const Shot01: React.FC = () => (
  <ShotFrame
    eyebrow="Step 1"
    title="Find every SVG on any page"
    sub="Inline icons, image SVGs, CSS backgrounds and sprites — all detected."
    popup={{count: 24, index: 0, filename: 'search-24', preview: 1}}
  />
)

/** 02 — the preview. */
export const Shot02: React.FC = () => (
  <ShotFrame
    eyebrow="Step 2"
    title="Preview each icon, logo & vector"
    sub="A clean, isolated look at the exact SVG you're about to save."
    popup={{count: 24, index: 2, filename: 'star-24', preview: 1}}
  />
)

/** 03 — paging. */
export const Shot03: React.FC = () => (
  <ShotFrame
    eyebrow="Step 3"
    title="Page through them one by one"
    sub="Previous and Next walk every SVG the page has to offer."
    popup={{count: 24, index: 1, filename: 'heart-24', hot: 'next'}}
  />
)

/** 04 — download the current one. */
export const Shot04: React.FC = () => (
  <ShotFrame
    eyebrow="Step 4"
    title="Download the original SVG in one click"
    sub="Name it, hit download, and get the real vector — not a screenshot."
    popup={{count: 24, index: 2, filename: 'star-24', hot: 'download', toast: 'Saved star.svg'}}
  />
)

/** 05 — the whole page as a ZIP. */
export const Shot05: React.FC = () => (
  <ShotFrame
    eyebrow="Step 5"
    title="Or grab them all as a ZIP"
    sub="Every SVG on the page, bundled and saved in a single click."
    popup={{count: 24, index: 2, filename: 'star-24', hot: 'zip', toast: '24 SVGs saved'}}
  />
)

// A brand-forward closing still — a sixth screenshot, or a spare.
export const ShotBrand: React.FC = () => (
  <Stage fade={false}>
    <BrandCard />
  </Stage>
)
