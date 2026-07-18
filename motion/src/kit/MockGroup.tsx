import React from 'react'
import {BrowserFrame} from './Chrome'
import {ICONS} from './icons'
import {IconPage} from './IconPage'
import {Popup, POPUP_W} from './Popup'

// The browser-plus-popup, frozen in one state, as a self-contained group with a
// fixed natural size (1240 × 690). Both the promo and every screenshot compose
// this so the product reads identically wherever it appears; the screenshots
// just scale it under a caption. Browser sits at the group origin; the popup
// hangs off its toolbar at top-right, exactly where Chrome drops a popup.

export const GROUP_W = 1240
export const GROUP_H = 690
const BROWSER_W = 1200
const P_LEFT = GROUP_W - POPUP_W - 4 // 876
const P_TOP = 92

type PopupState = {
  count: number
  index: number
  filename: string
  hot?: 'refresh' | 'prev' | 'next' | 'download' | 'zip' | null
  pressed?: boolean
  toast?: string
  preview?: number
}

export const MockGroup: React.FC<{popup: PopupState; showPopup?: boolean}> = ({
  popup,
  showPopup = true,
}) => (
  <div style={{position: 'relative', width: GROUP_W, height: GROUP_H}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: BROWSER_W, height: GROUP_H}}>
      <BrowserFrame
        url="vectorly.io/icons"
        title="Vectorly — 3,400 free line icons"
        active={showPopup}
        style={{width: '100%', height: '100%'}}
      >
        <IconPage lit={showPopup ? popup.index : undefined} />
      </BrowserFrame>
    </div>

    {showPopup ? (
      <div style={{position: 'absolute', left: P_LEFT, top: P_TOP, zIndex: 40}}>
        <Popup
          count={popup.count}
          index={popup.index}
          total={ICONS.length}
          filename={popup.filename}
          preview={popup.preview ?? 1}
          hot={popup.hot ?? null}
          pressed={popup.pressed}
          toast={popup.toast}
          progress={1}
        />
      </div>
    ) : null}
  </div>
)
