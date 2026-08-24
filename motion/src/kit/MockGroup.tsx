import React from 'react'
import {BrowserFrame} from './Chrome'
import {ICONS} from './icons'
import {IconPage} from './IconPage'
import {type Format, type Hot, Popup, POPUP_W} from './Popup'

// The browser-plus-popup, frozen in one state, as a self-contained group with a
// fixed natural size (1200 × 776). Both the promo and every screenshot compose
// this so the product reads identically wherever it appears; the screenshots
// just scale it under a caption. Browser sits at the group origin; the popup
// hangs off its toolbar at top-right, exactly where Chrome drops a popup.
//
// The group is 776 tall because the shipped popup is ~672 and hangs from y=92:
// the window has to be deep enough to contain it, or the panel floats off the
// bottom edge of a screenshot.

export const GROUP_W = 1200
export const GROUP_H = 776
const BROWSER_W = 1200
const P_LEFT = GROUP_W - POPUP_W - 8 // 832 — anchored inside the window, as Chrome anchors it
const P_TOP = 92

type PopupState = {
  count: number
  index: number
  filename: string
  hot?: Hot
  pressed?: boolean
  /** The popup's own status line — quote popup.js, don't invent copy. */
  status?: string
  /** Chrome's downloads tray, 0..1 — the real confirmation for a single save. */
  downloadTray?: number
  format?: Format
  scale?: 1 | 2 | 4
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
        downloadTray={popup.downloadTray ?? 0}
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
          status={popup.status}
          format={popup.format ?? 'svg'}
          scale={popup.scale ?? 2}
          progress={1}
        />
      </div>
    ) : null}
  </div>
)
