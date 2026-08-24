// The two faces the product actually ships: Bricolage Grotesque (variable) for
// display, Space Mono for the technical voice. Both are the same .woff2 files
// the extension and the site load, copied into public/ so `staticFile` can reach
// them — a recording set in the wrong typeface reads as a different product.
//
// Remotion renders each frame in a fresh page, so the load has to be gated:
// `delayRender` holds the frame until the faces are actually usable, otherwise
// early frames capture the fallback and the set flickers between two designs.

import {continueRender, delayRender, staticFile} from 'remotion'
import {useEffect, useState} from 'react'

type Face = {family: string; file: string; descriptors: FontFaceDescriptors}

const FACES: Face[] = [
  {
    family: 'Bricolage Grotesque',
    file: 'fonts/bricolage-var.woff2',
    descriptors: {weight: '200 800', stretch: '75% 100%', style: 'normal'},
  },
  {
    family: 'Space Mono',
    file: 'fonts/space-mono-400.woff2',
    descriptors: {weight: '400', style: 'normal'},
  },
  {
    family: 'Space Mono',
    file: 'fonts/space-mono-700.woff2',
    descriptors: {weight: '700', style: 'normal'},
  },
]

let loaded: Promise<void> | null = null

const loadAll = () => {
  loaded ??= Promise.all(
    FACES.map(async (f) => {
      const face = new FontFace(f.family, `url(${staticFile(f.file)}) format('woff2')`, f.descriptors)
      await face.load()
      // `FontFaceSet.add` is a Set method the DOM lib types omit on this target.
      ;(document.fonts as unknown as {add: (f: FontFace) => void}).add(face)
    }),
  ).then(() => undefined)
  return loaded
}

/**
 * Blocks the frame until both faces are ready. Every scene calls this (via
 * `Stage`), so no composition can render half-typeset.
 */
export const useBrandFonts = (): boolean => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handle = delayRender('Loading Bricolage Grotesque and Space Mono')
    let live = true
    loadAll()
      .catch(() => undefined) // a missing face must not deadlock the render
      .then(() => {
        if (live) setReady(true)
        continueRender(handle)
      })
    return () => {
      live = false
    }
  }, [])

  return ready
}
