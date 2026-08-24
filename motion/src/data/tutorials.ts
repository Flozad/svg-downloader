import type {TutorialSpec} from '../scenes/Tutorial'

// The fifteen tutorial recordings, one entry each.
//
// Every entry is a real program, not a re-caption of the same clip: the beats
// differ because the tasks differ. A viewer who searched "copy svg from website"
// gets the Copy code button pressed on screen; one who searched "svg grabber"
// gets the right-click menu. The eyebrow is the query the page ranks for, so the
// first frame shows the viewer their own words.
//
// Ids double as output filenames (docs/motion/tutorials/<id>.mp4) and as the
// slug of the page the video belongs to, so a page and its video can never drift
// apart without the render script noticing.

export const TUTORIALS: TutorialSpec[] = [
  {
    id: 'download-svg-from-url',
    eyebrow: 'download svg from url',
    title: 'Download an SVG when all you have is a URL',
    beats: [
      {kind: 'browse', caption: 'Open the URL that holds the vector'},
      {kind: 'open', caption: 'Click the toolbar button — it reads the live page'},
      {kind: 'hold', caption: 'The address bar has no .svg in it. It does not need one.'},
      {kind: 'page', caption: 'Page to the vector you came for', to: 2},
      {kind: 'name', caption: 'Name the file before you save it', text: 'star'},
      {kind: 'download', caption: 'Download current — the real markup, from that URL'},
      {kind: 'hold', caption: 'Saved as star.svg. Sharp at any size.'},
    ],
  },

  {
    id: 'download-svg-from-link',
    eyebrow: 'download svg from link',
    title: 'Save an SVG from a link instead of an HTML page',
    beats: [
      {kind: 'browse', caption: 'A link that points at a vector, not a page'},
      {kind: 'hold', caption: 'Save link as… would hand you the HTML wrapper'},
      {kind: 'open', caption: 'Open the popup on the page the link is on'},
      {kind: 'page', caption: 'The linked vector is in the list', to: 3},
      {kind: 'name', caption: 'Give it a name that means something', text: 'bell'},
      {kind: 'download', caption: 'Download current — the file behind the link'},
    ],
  },

  {
    id: 'copy-svg-from-website',
    eyebrow: 'copy svg from website',
    title: 'Copy an SVG from a website — as code or as a picture',
    beats: [
      {kind: 'open', caption: 'Open the popup on the page you are reading'},
      {kind: 'page', caption: 'Land on the icon you want', to: 2},
      {kind: 'copy', caption: 'Copy code — the markup, straight to your clipboard', what: 'code'},
      {kind: 'hold', caption: 'Paste it into a component and it just works'},
      {kind: 'copy', caption: 'Or Copy image — a PNG, for docs and chat', what: 'image'},
      {kind: 'hold', caption: 'Two clipboards, one icon. No file on disk either way.'},
    ],
  },

  {
    id: 'save-svg-from-website',
    eyebrow: 'save svg from website',
    title: 'Save an SVG when right-click has nothing to offer',
    beats: [
      {kind: 'browse', caption: 'Save image as… is missing on every icon here'},
      {kind: 'open', caption: 'The extension reads the DOM instead of the menu'},
      {kind: 'hold', caption: 'Inline, CSS background, sprite, img — all found'},
      {kind: 'page', caption: 'Pick the one you actually want', to: 1},
      {kind: 'name', caption: 'Name it', text: 'heart'},
      {kind: 'download', caption: 'Saved — a real vector, not a screenshot'},
    ],
  },

  {
    id: 'extract-svg-from-website',
    eyebrow: 'extract svg from website',
    title: 'Extract every SVG on a website in one pass',
    beats: [
      {kind: 'open', caption: 'One scan finds every vector the page renders'},
      {kind: 'page', caption: 'Check the set before you take it', to: 2},
      {kind: 'page', caption: 'Prev and Next walk the whole list', to: 5},
      {kind: 'zip', caption: 'Download all as ZIP — the entire set at once'},
      {kind: 'hold', caption: 'De-duplicated, numbered, and named in the status line'},
    ],
  },

  {
    id: 'grab-svg-from-website',
    eyebrow: 'svg grabber',
    title: 'Grab one SVG fast, without opening anything',
    beats: [
      {kind: 'browse', caption: 'You want one icon, and you want it now'},
      {kind: 'rightClick', caption: 'Right-click it and take Save this as SVG'},
      {kind: 'hold', caption: 'No popup, no scan — one menu item, one file'},
      {kind: 'hold', caption: 'The same sanitiser runs, so the file still opens anywhere'},
    ],
  },

  {
    id: 'download-svg-from-webpage',
    eyebrow: 'download svg from webpage',
    title: 'Take an inventory of every SVG on a webpage',
    beats: [
      {kind: 'browse', caption: 'How many vectors does this page actually have?'},
      {kind: 'open', caption: 'The counter answers it — 24 found'},
      {kind: 'page', caption: 'Page through to see what you are getting', to: 4},
      {kind: 'zip', caption: 'Then take the lot in one click'},
      {kind: 'hold', caption: 'Anything that could not be resolved is named, not silently dropped'},
    ],
  },

  {
    id: 'download-svg-from-html',
    eyebrow: 'download svg from html',
    title: 'Pull an SVG out of the HTML without opening DevTools',
    beats: [
      {kind: 'open', caption: 'The markup is inline in the HTML — no file to fetch'},
      {kind: 'page', caption: 'Find the element you want', to: 2},
      {kind: 'copy', caption: 'Copy code lifts the markup itself', what: 'code'},
      {kind: 'hold', caption: 'View-source would give you the same tag, minus the xmlns'},
      {kind: 'download', caption: 'Or save it as a file, namespace repaired'},
    ],
  },

  {
    id: 'how-to-download-svg-files',
    eyebrow: 'how to download svg files',
    title: 'How to download SVG files, start to finish',
    beats: [
      {kind: 'browse', caption: 'An SVG is vector text, not a picture of one'},
      {kind: 'open', caption: 'Step one — open the popup on the page'},
      {kind: 'hold', caption: 'Step two — let it scan. It reads the page, not the network.'},
      {kind: 'page', caption: 'Step three — preview and pick', to: 2},
      {kind: 'name', caption: 'Step four — name the file', text: 'star'},
      {kind: 'download', caption: 'Step five — download. That is the whole job.'},
    ],
  },

  {
    id: 'extract-svg-logo-from-website',
    eyebrow: 'extract svg logo from website',
    title: 'Extract a company logo as a real vector',
    beats: [
      {kind: 'browse', caption: 'The logo in the header is one inline <svg>'},
      {kind: 'open', caption: 'Scan the page and it comes back with the rest'},
      {kind: 'page', caption: 'Page to the mark itself', to: 6},
      {kind: 'name', caption: 'Name it properly for your brand folder', text: 'vectorly-logo'},
      {kind: 'download', caption: 'Saved at full fidelity — scales to a billboard'},
      {kind: 'hold', caption: 'Check the licence before you reuse somebody’s mark'},
    ],
  },

  {
    id: 'free-svg-downloader',
    eyebrow: 'free svg downloader',
    title: 'A free SVG downloader with nothing held back',
    beats: [
      {kind: 'open', caption: 'No account, no trial, no watermark'},
      {kind: 'page', caption: 'Every icon on the page, free to preview', to: 2},
      {kind: 'download', caption: 'Single downloads — free'},
      {kind: 'zip', caption: 'Bulk ZIP — also free'},
      {kind: 'hold', caption: 'MIT-licensed and on-device. Nothing is uploaded anywhere.'},
    ],
  },

  {
    id: 'svg-downloader-extension',
    eyebrow: 'svg downloader extension',
    title: 'The extension, installed and working in a minute',
    beats: [
      {kind: 'browse', caption: 'Install once from the Chrome Web Store'},
      {kind: 'open', caption: 'Pin it, then click it on any page'},
      {kind: 'hold', caption: 'It asks for activeTab — this page, this click, nothing else'},
      {kind: 'page', caption: 'Chrome, Edge and Brave all run it', to: 2},
      {kind: 'download', caption: 'And it works the same in all three'},
    ],
  },

  {
    id: 'download-svg-image-from-website',
    eyebrow: 'download svg image from website',
    title: 'Download an SVG image — or convert it on the way out',
    beats: [
      {kind: 'open', caption: 'The image is an SVG, so it has no fixed size'},
      {kind: 'page', caption: 'Pick the image you want', to: 2},
      {kind: 'download', caption: 'Take the vector if you will edit it'},
      {kind: 'format', caption: 'Or switch to PNG if you need a raster', to: 'png'},
      {kind: 'hold', caption: 'Rendered on your machine at 1×, 2× or 4×'},
      {kind: 'download', caption: 'Same icon, now a pixel-perfect PNG'},
    ],
  },

  {
    id: 'svg-extractor-online',
    eyebrow: 'svg extractor online',
    title: 'Why an online SVG extractor cannot see this page',
    beats: [
      {kind: 'browse', caption: 'An online tool only gets the URL you paste'},
      {kind: 'hold', caption: 'It never runs the page, so inline icons stay invisible'},
      {kind: 'open', caption: 'An extension runs inside the page you are already on'},
      {kind: 'hold', caption: 'Logged-in pages and private dashboards included'},
      {kind: 'zip', caption: 'And nothing leaves your machine to make it work'},
    ],
  },

  {
    id: 'website-svg-downloader',
    eyebrow: 'website svg downloader',
    title: 'One icon, a whole set, or the markup — pick your exit',
    beats: [
      {kind: 'open', caption: 'One scan, then three ways out'},
      {kind: 'page', caption: 'Preview until you find it', to: 2},
      {kind: 'download', caption: 'One file — Download current'},
      {kind: 'zip', caption: 'The whole page — Download all as ZIP'},
      {kind: 'copy', caption: 'Or no file at all — Copy code', what: 'code'},
      {kind: 'hold', caption: 'Same scan, same page, whichever one you need'},
    ],
  },
]

export const tutorialById = (id: string): TutorialSpec => {
  const found = TUTORIALS.find((x) => x.id === id)
  if (!found) throw new Error(`Unknown tutorial: ${id}`)
  return found
}
