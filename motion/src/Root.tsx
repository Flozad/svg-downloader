import React from 'react'
import {Composition} from 'remotion'
import {Promo} from './scenes/Promo'
import {Shot01, Shot02, Shot03, Shot04, Shot05, ShotBrand} from './shots/Shots'
import {Marquee, PromoTile} from './shots/Tiles'
import {MARQUEE, PROMO, PROMO_TILE, SHOT} from './kit/theme'

// One composition per deliverable. The id is the render's output name, so it is
// the store filename too — don't rename one without the render script.
//
//   promo         → the ≤30s Chrome Web Store promo video (1280×800)
//   shot-01..05   → the store screenshots, 1280×800 (the preferred size)
//   shot-brand    → a spare brand screenshot
//   promo-tile    → the Small promo tile, 440×280
//   marquee-tile  → the Marquee promo tile, 1400×560

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="promo" component={Promo} durationInFrames={24 * PROMO.fps} {...PROMO} />

    <Composition id="shot-01" component={Shot01} durationInFrames={1} {...SHOT} />
    <Composition id="shot-02" component={Shot02} durationInFrames={1} {...SHOT} />
    <Composition id="shot-03" component={Shot03} durationInFrames={1} {...SHOT} />
    <Composition id="shot-04" component={Shot04} durationInFrames={1} {...SHOT} />
    <Composition id="shot-05" component={Shot05} durationInFrames={1} {...SHOT} />
    <Composition id="shot-brand" component={ShotBrand} durationInFrames={1} {...SHOT} />

    <Composition id="promo-tile" component={PromoTile} durationInFrames={1} {...PROMO_TILE} />
    <Composition id="marquee-tile" component={Marquee} durationInFrames={1} {...MARQUEE} />
  </>
)
