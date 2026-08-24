// The copy for the fifteen tutorial pages.
//
// Each entry answers ONE search intent, and the entries are deliberately not
// paraphrases of each other: "copy svg from website" wants the clipboard,
// "svg grabber" wants the right-click menu, "svg extractor online" wants to know
// why a paste-a-URL tool can't see the page. Writing fifteen versions of the
// same page would split the same traffic fifteen ways and rank none of them, so
// every page here has its own angle, its own recording, and its own FAQ.
//
// `slug` must match a tutorial id in motion/src/data/tutorials.ts — the build
// throws if a page has no rendered video.

export const TUTORIALS = [
  // ───────────────────────────────────────────────────────────── 01 ──
  {
    slug: 'how-to-download-svg-files',
    cardTag: 'Start here',
    cardTitle: 'How to download SVG files',
    cardBlurb:
      'The whole job in five steps, for anyone who has never done it before — what an SVG actually is, and why it needs opening differently.',

    title: 'How to Download SVG Files From a Website (Free, 2 Minutes)',
    description:
      'A beginner-friendly walkthrough: what an SVG file is, why right-click fails, and the five steps that save a real vector from any web page. Free, no upload.',
    crumb: 'How to download SVG files',
    eyebrow: 'Tutorial — the basics, properly',
    h1: 'How to <span class="plot">download SVG files</span> from a website',
    lede: 'If you have never saved a vector off a web page before, start here. Two minutes, five steps, and an explanation of the one thing that confuses everybody the first time.',

    videoHeading: 'The whole thing, once through',
    videoTag: 'tutorial · basics',
    videoName: 'How to download SVG files from a website',
    videoDescription:
      'The SVG Downloader popup opens on a page of icons, scans it, reports 24 found, pages through the previews to a star, takes a filename, and downloads star.svg.',
    videoCaption:
      'Open, scan, preview, name, download. Nothing is sped up — that really is how long it takes.',
    videoIntro:
      'Everything after this point is the same five steps written out, plus the reasons behind them. If you just wanted the recording, you already have what you came for.',
    posterAlt: 'The SVG Downloader popup previewing a star icon found on a page of icons.',

    bodyEyebrow: 'First, the thing nobody explains',
    bodyHeading: 'An SVG is not a picture — it is instructions for drawing one',
    body: `
  <p class="lead-in">A PNG is a grid of coloured dots. An SVG is a short text document that says <em>draw a line from here to here, then curve to there</em>. That difference is the entire reason this is worth doing: because the file describes shapes rather than pixels, it stays perfectly sharp whether you use it as a 16px favicon or print it two metres wide, and you can open it in a text editor and change its colour by editing one word.</p>
  <p>It is also the reason your browser is unhelpful about saving them. The browser only offers <em>Save image as…</em> for things it classifies as images with a fetchable address. Most SVGs on a modern page have no address at all — the drawing instructions are written directly into the page's HTML. There is nothing for the save menu to point at, so the menu item simply doesn't appear.</p>
  <p>Reading the page's DOM sidesteps that entirely. The extension asks the page what it actually rendered, gets the real markup back, and writes it to a file.</p>`,

    stepsHeading: 'The five steps',
    stepsIntro:
      'The first run takes about two minutes because you have to install something. Every run after that is about five seconds.',
    steps: [
      {
        name: 'Install the extension',
        text: 'Add <a href="https://chromewebstore.google.com/detail/svg-web-downloader-extrac/jfgljaebonkbegekbcfbiojgkjlbhpjn">SVG Downloader</a> to Chrome, Edge or Brave — anything on Chrome 88 or later. It is free and MIT-licensed, and it asks only for <code>activeTab</code>, which means it can see a page when you click its button and at no other time.',
      },
      {
        name: 'Open the popup on the page',
        text: 'Go to the page holding the vector you want, then click the toolbar button. If you cannot see it, click the puzzle-piece icon and pin it — you will want it there.',
      },
      {
        name: 'Let it scan',
        text: 'It walks the page and collects every vector it can resolve: inline elements, CSS background images, same-document sprite references, and <code>&lt;img&gt;</code> or <code>&lt;object&gt;</code> sources including <code>data:</code> URIs. The counter tells you how many it found.',
      },
      {
        name: 'Preview and pick',
        text: 'Each one gets an isolated preview, off the busy page, so you can confirm you have the right thing. <em>Prev</em> and <em>Next</em> walk the list, and the pager shows where you are.',
      },
      {
        name: 'Name it and download',
        text: 'Type a filename if you care what it is called — leave it blank and you get a numbered <code>svg-1.svg</code>. Then hit <em>Download current</em>. The file lands in your downloads folder like any other.',
      },
    ],

    after: `
  <h2>Two surprises, both normal</h2>
  <p>Almost everyone hits one of these on their first file, and neither is a fault.</p>
  <ul>
    <li><strong>The icon is black.</strong> Most icon systems colour their icons from CSS using <code>currentColor</code>, which means the colour lives in the stylesheet, not in the shape. Pulled out on its own, the file has no colour of its own and renders black. That is the true source markup. To fix a colour into the file, use the hand-off to the <a href="https://clasicwebtools.com">SVG Color Changer</a>, recolour, and save.</li>
    <li><strong>It opens now, when copy-paste never worked before.</strong> Inline SVG usually omits the <code>xmlns="http://www.w3.org/2000/svg"</code> namespace, because the HTML parser supplies it for free. Copy that markup into a bare <code>.svg</code> file by hand and nothing will open it. SVG Downloader repairs the missing namespace on the way out, which is why its files open in Figma, Illustrator, Inkscape, VS Code and every browser.</li>
  </ul>

  <h2>Opening the file once you have it</h2>
  <p>Double-clicking an SVG usually opens it in your browser, which renders it but won't let you edit it. To actually work with it: drag it into <strong>Figma</strong> and it arrives as editable vector layers; open it in <strong>Illustrator</strong> or <strong>Inkscape</strong> for full drawing tools; or open it in any text editor to see — and change — the markup directly. If you need a PNG instead, the popup will convert it for you before it saves.</p>`,

    facts: [
      ['Works on', 'Chrome 88+, Edge and Brave. <strong>Any page</strong> you can open in them.'],
      [
        'You get',
        'The <strong>original vector markup</strong>, namespace repaired — not a screenshot.',
      ],
      [
        'Privacy',
        '<strong>100% on-device.</strong> No server, no account, no upload, no analytics.',
      ],
      [
        'Next',
        'Need the whole set? <a href="/tutorials/extract-svg-from-website">Extract every SVG</a>. Just want the code? <a href="/tutorials/copy-svg-from-website">Copy it</a>.',
      ],
    ],

    faq: [
      {
        q: 'What is an SVG file, exactly?',
        a: 'A plain-text document describing shapes — lines, curves, fills — rather than pixels. Because it stores instructions instead of a grid of dots, it renders perfectly sharp at any size, and you can open it in a text editor and read it.',
      },
      {
        q: 'Why is there no "Save image as…" on the icon I want?',
        a: 'Because it is not an image as far as the browser is concerned. Inline SVG markup, CSS background images and sprite references have no fetchable address behind them, so the browser has nothing to offer to save. Reading the page instead is how you get around that.',
      },
      {
        q: 'Do I need to pay for anything?',
        a: 'No. SVG Downloader is free and MIT-licensed, currently version 1.3. There is no paid tier, no trial, no watermark and no account.',
      },
      {
        q: 'Is my file uploaded anywhere?',
        a: 'No. Everything runs on-device inside your browser. There is no server, no upload and no analytics — the vector never leaves your machine.',
      },
      {
        q: 'How do I open an SVG after downloading it?',
        a: 'Drag it into Figma for editable layers, open it in Illustrator or Inkscape for full drawing tools, or open it in any text editor to read and edit the markup. Double-clicking usually opens it in your browser, which renders it but will not let you edit it.',
      },
    ],

    ctaHeading: 'Save your first vector in about a minute',
    ctaSub: 'Free, private, and it reads the SVGs the browser pretends are not there.',
    related: [
      ['/tutorials/save-svg-from-website', 'When right-click fails', 'The greyed-out menu'],
      ['/tutorials/copy-svg-from-website', 'Copy instead of save', 'Straight to the clipboard'],
      ['/tutorials/extract-svg-from-website', 'Take the whole set', 'Every SVG at once'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 02 ──
  {
    slug: 'download-svg-from-url',
    cardTag: 'From a URL',
    cardTitle: 'Download an SVG from a URL',
    cardBlurb:
      'When you have an address rather than a file — a CDN link, a page URL, a route that ends in nothing useful. Why pasting it into a converter usually fails.',

    title: 'Download SVG From URL — Without a Converter Site',
    description:
      'Have a URL but no file? Open it, scan the live page, and save the real vector — even when the address has no .svg in it and the page renders everything inline.',
    crumb: 'Download from a URL',
    eyebrow: 'Tutorial — you have an address',
    h1: 'How to <span class="plot">download an SVG from a URL</span>',
    lede: 'A URL is not a file. Sometimes it points straight at a vector, sometimes it points at a page that draws one, and the two need completely different handling — which is why paste-a-URL tools work about half the time.',

    videoHeading: 'From address bar to saved file',
    videoTag: 'tutorial · from a url',
    videoName: 'Download an SVG when all you have is a URL',
    videoDescription:
      'A page is open at an ordinary URL with no .svg in it. The SVG Downloader popup scans the live page, finds 24 vectors, pages to a star, takes the filename star, and downloads it.',
    videoCaption:
      'The address bar says <code>vectorly.io/icons</code> — no file extension anywhere. The vector comes out anyway.',
    videoIntro:
      'Notice what the address bar says in the recording. There is no <code>.svg</code> in it, and there does not need to be: the scan reads what the page rendered, not what the URL promises.',
    posterAlt:
      'A browser at an ordinary page URL with the SVG Downloader popup listing the vectors it found.',

    bodyEyebrow: 'The distinction that matters',
    bodyHeading: 'Two completely different things get called "an SVG URL"',
    body: `
  <p class="lead-in">Before anything else, work out which of these you actually have — the right method is different for each, and this is where most people get stuck.</p>
  <ul>
    <li><strong>A direct URL to a vector file</strong>, ending in <code>.svg</code>, often on a CDN. Open it in a tab and you see the graphic on a blank white background with nothing else. This one your browser <em>can</em> save on its own — <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> works fine, though it may save under an unhelpful name.</li>
    <li><strong>A URL to a page that draws vectors.</strong> Almost every real URL is this one. The address ends in <code>/icons</code> or <code>/pricing</code> or nothing at all, and the graphics you want are inline markup inside the HTML the page returns. There is no file at any address to fetch, so there is nothing to save directly.</li>
  </ul>
  <p>Paste-a-URL converter sites only ever handle the first case, which is why they so often come back with an error or with the page's HTML renamed to <code>.svg</code>. They fetch the address; they do not render it.</p>`,

    stepsHeading: 'Saving from a page URL',
    stepsIntro:
      'This is the second case — the common one. The trick is to stop treating the URL as a file and let the page render first.',
    steps: [
      {
        name: 'Open the URL in a tab',
        text: 'Let the page finish loading. This matters more than it sounds: icons injected by JavaScript after load are still found, because the scan reads the DOM as it stands when you click, not the HTML the server first sent.',
      },
      {
        name: 'Click the toolbar button',
        text: 'The popup opens against the tab you are on. There is nothing to paste and nothing to configure.',
      },
      {
        name: 'Read the counter',
        text: 'It reports how many vectors that URL actually renders. That number is usually higher than people expect, because it includes the logo, the UI chrome and the icons in the footer.',
      },
      {
        name: 'Page to the one you came for',
        text: 'Use <em>Prev</em> and <em>Next</em>. The preview shows each one isolated, which is the fastest way to tell two similar icons apart.',
      },
      {
        name: 'Name it and download',
        text: 'Type a filename and press <em>Download current</em>. You get the original markup from that URL, with the <code>xmlns</code> namespace repaired so the file opens anywhere.',
      },
    ],

    after: `
  <h2>If your URL really does end in .svg</h2>
  <p>Then you have the easy case, and you have options. Opening it and pressing <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> will save it. So will the extension, which additionally lets you name the file properly and repair the namespace if the source is malformed — worth it for anything you are about to check into a repository.</p>
  <p>One caveat on direct URLs: a lot of CDN links serve the file with a <code>Content-Type</code> of <code>text/plain</code>, in which case your browser shows you the markup as text rather than rendering it. The file is fine; the header is wrong. Saving it still gives you a working SVG.</p>

  <h2>URLs the extension cannot reach</h2>
  <p>It runs on pages you can open, so anything you cannot open, it cannot read either. In practice that means <code>chrome://</code> and other browser-internal pages, the Chrome Web Store and add-on galleries (browsers block extensions there on purpose), local <code>file://</code> pages unless you grant file access, and anything behind a login you do not have. If you <em>are</em> logged in, though, it works normally — which is one thing no online tool can do with a URL you paste.</p>`,

    facts: [
      [
        'Input',
        'Any <strong>page URL</strong> you can open — no <code>.svg</code> extension required.',
      ],
      [
        'Handles',
        'JavaScript-rendered icons, logged-in pages, and inline markup with no address behind it.',
      ],
      [
        'Output',
        'The original vector, <strong>namespace repaired</strong>, named however you like.',
      ],
      [
        'Also see',
        '<a href="/tutorials/download-svg-from-link">From a link</a> · <a href="/tutorials/svg-extractor-online">Why online extractors miss this</a>',
      ],
    ],

    faq: [
      {
        q: 'Can I just paste a URL into an online SVG downloader?',
        a: 'Only if the URL points directly at a .svg file. An online tool fetches the address but never renders the page, so any vector drawn as inline markup — which is most of them — is invisible to it. An extension runs inside the page after it has rendered, which is why it sees them.',
      },
      {
        q: 'The URL has no .svg in it. Is that a problem?',
        a: 'No. The scan reads what the page rendered, not what the address promised. A URL ending in /icons or /pricing works exactly the same as one ending in .svg.',
      },
      {
        q: 'Why does opening the .svg URL show me code instead of a picture?',
        a: 'The server is sending it with a text/plain content type instead of image/svg+xml, so the browser displays it rather than rendering it. The file itself is fine — saving it gives you a working SVG.',
      },
      {
        q: 'Does it work on a page I had to log in to see?',
        a: 'Yes. It runs inside your browser on the page you are already looking at, so your session applies normally. This is the main thing a paste-a-URL service cannot do.',
      },
      {
        q: 'What about a URL that redirects?',
        a: 'Follow it in the tab first. Whatever page you end up on is the page that gets scanned, which is almost always what you wanted anyway.',
      },
    ],

    ctaHeading: 'Point it at a URL and take the vector',
    ctaSub: 'No pasting, no upload, and it works on pages that need you logged in.',
    related: [
      ['/tutorials/download-svg-from-link', 'From a link', 'Save link as… lies'],
      ['/tutorials/svg-extractor-online', 'Vs. online extractors', 'Why they miss things'],
      ['/tutorials/download-svg-from-webpage', 'Whole-page inventory', 'Everything at once'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 03 ──
  {
    slug: 'download-svg-from-link',
    cardTag: 'From a link',
    cardTitle: 'Download an SVG from a link',
    cardBlurb:
      'Why "Save link as…" hands you an HTML file instead of a vector, and how to get the actual thing the link points at.',

    title: 'Download SVG From a Link — Not the HTML Behind It',
    description:
      'Save link as… often saves the page, not the vector. Here is why that happens and how to get the real SVG behind a link, including links that open a viewer page.',
    crumb: 'Download from a link',
    eyebrow: 'Tutorial — the link trap',
    h1: 'How to <span class="plot">download an SVG from a link</span>',
    lede: 'You right-click the link, choose <em>Save link as…</em>, and get a 40KB HTML file. This is the most common way to end up with the wrong thing, and it has a simple explanation.',

    videoHeading: 'Getting what the link actually points at',
    videoTag: 'tutorial · from a link',
    videoName: 'Save an SVG from a link instead of an HTML page',
    videoDescription:
      'A page with links to vectors. Rather than using Save link as…, the SVG Downloader popup opens, finds the vector in its list, takes the filename bell, and saves the real file.',
    videoCaption: 'The link stays untouched. The vector comes out of the page the link is on.',
    videoIntro:
      'The recording deliberately never uses <em>Save link as…</em> — because on a link like this, that menu item is the trap rather than the tool.',
    posterAlt: 'The SVG Downloader popup showing a bell icon found on a page of linked icons.',

    bodyEyebrow: 'Why the obvious thing fails',
    bodyHeading: 'Save link as… saves the response, whatever it turns out to be',
    body: `
  <p class="lead-in">Your browser has no idea what is at the other end of a link until it asks. <em>Save link as…</em> does not inspect anything — it fetches the URL and writes whatever comes back to disk, under whatever name the link suggests.</p>
  <p>So when the link goes to a <em>viewer page</em> — an icon detail page, a "download" page with a preview and a button — what comes back is HTML. You get a file called <code>star.svg</code> that is actually a web page, which is why it opens as a wall of text or refuses to open at all. The extension was never wrong; the link just never pointed at a vector in the first place.</p>
  <p>Three link shapes cause almost all of this:</p>
  <ul>
    <li><strong>A link to a viewer page.</strong> The vector is on the destination, not at the link. Follow it, then scan that page.</li>
    <li><strong>A link that triggers a download by script.</strong> The <code>href</code> is <code>#</code> or <code>javascript:</code>, and a click handler builds the file. There is nothing at the address to save.</li>
    <li><strong>A link wrapping an inline icon.</strong> The clickable thing <em>is</em> the graphic, drawn as markup. Right-clicking it gives you the page menu — no image options at all, because the browser does not consider it an image.</li>
  </ul>`,

    stepsHeading: 'The method that works on all three',
    stepsIntro:
      'Stop trying to save the link. Save the vector from the page that renders it — the answer is the same regardless of which of the three shapes you are looking at.',
    steps: [
      {
        name: 'Follow the link if it goes somewhere',
        text: 'If it opens a viewer or detail page, let it. That destination is where the vector actually lives, and it is what you want to scan.',
      },
      {
        name: 'Open the popup on whatever page you land on',
        text: 'Click the toolbar button. The scan does not care whether you arrived by link, by search or by typing the address.',
      },
      {
        name: 'Find it in the list',
        text: 'Page through with <em>Prev</em> and <em>Next</em>. On a detail page the vector you want is usually large and obvious in the preview.',
      },
      {
        name: 'Name it and download',
        text: 'Type a filename and press <em>Download current</em>. What you get is a real vector file, not an HTML document wearing an .svg extension.',
      },
    ],

    after: `
  <h2>How to tell what you actually downloaded</h2>
  <p>If you already have a suspect file, this takes ten seconds: open it in any text editor. A real SVG starts with <code>&lt;svg</code> or an XML declaration and is usually a few kilobytes. An HTML page in disguise starts with <code>&lt;!doctype html&gt;</code> and is typically much larger. If it is the second one, the link went to a page, and scanning that page will get you the real thing.</p>

  <h2>When the link is the icon</h2>
  <p>This is the third shape, and the most common on modern sites — a clickable icon that is inline <code>&lt;svg&gt;</code> markup. There is genuinely nothing to save: no address, no file, no image the browser recognises. Either scan the page, or right-click it and take <strong>Save this as SVG</strong> from the menu, which is covered in <a href="/tutorials/grab-svg-from-website">the quick-grab tutorial</a>.</p>`,

    facts: [
      [
        'The trap',
        '<em>Save link as…</em> writes <strong>whatever the URL returns</strong> — often HTML.',
      ],
      [
        'The check',
        'Open the file in a text editor. <code>&lt;!doctype html&gt;</code> means you got a page.',
      ],
      ['The fix', 'Scan the page that renders the vector, rather than saving the link.'],
      [
        'Also see',
        '<a href="/tutorials/grab-svg-from-website">Right-click grab</a> · <a href="/tutorials/download-svg-from-url">From a URL</a>',
      ],
    ],

    faq: [
      {
        q: 'Why did Save link as… give me an HTML file?',
        a: 'Because the link pointed at a web page rather than a vector file. Save link as… fetches the URL and writes whatever comes back, without checking what it is — so a link to a viewer page produces a page, saved under the .svg name the link suggested.',
      },
      {
        q: 'The link href is just # — where is the file?',
        a: 'There is not one. A click handler builds the file in JavaScript when you click. Nothing exists at that address to save, so scanning the page for the rendered vector is the only route.',
      },
      {
        q: 'How can I check whether my file is a real SVG?',
        a: 'Open it in a text editor. A real SVG starts with <svg or an XML declaration. An HTML page starts with <!doctype html> and is usually much bigger.',
      },
      {
        q: 'The link is an icon itself and right-click offers nothing useful.',
        a: 'That icon is inline SVG markup, which the browser does not treat as an image, so no image options appear. Either open the popup and scan the page, or use the extension’s own "Save this as SVG" item in the right-click menu.',
      },
    ],

    ctaHeading: 'Stop saving pages named .svg',
    ctaSub: 'Take the vector out of the page instead — it works on all three kinds of link.',
    related: [
      ['/tutorials/grab-svg-from-website', 'Right-click grab', 'One icon, one menu item'],
      ['/tutorials/download-svg-from-url', 'From a URL', 'Address, not file'],
      ['/tutorials/save-svg-from-website', 'When right-click fails', 'The greyed-out menu'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 04 ──
  {
    slug: 'save-svg-from-website',
    cardTag: 'Right-click fails',
    cardTitle: 'Save an SVG when right-click won’t',
    cardBlurb:
      'The greyed-out — or entirely absent — Save image as… menu, explained. And the four hiding places that cause it.',

    title: 'Save an SVG From a Website When Right-Click Won’t',
    description:
      'Save image as… missing or greyed out on the icon you want? Here is exactly why, what the four hiding places are, and how to save the real vector anyway.',
    crumb: 'When right-click fails',
    eyebrow: 'Tutorial — the greyed-out menu',
    h1: 'How to <span class="plot">save an SVG</span> when right-click won’t let you',
    lede: 'You right-click the icon and there is no <em>Save image as…</em> at all. Nothing is broken and you have not missed a setting — the browser genuinely does not think that thing is an image.',

    videoHeading: 'Saving what the menu won’t offer',
    videoTag: 'tutorial · no right-click',
    videoName: 'Save an SVG when right-click has nothing to offer',
    videoDescription:
      'A page whose icons offer no Save image as… option. The SVG Downloader popup opens, scans the DOM, finds every vector, pages to a heart, names it and saves it.',
    videoCaption: 'Every icon on this page refuses the save menu. All 24 come out anyway.',
    videoIntro:
      'The recording opens on a page where not one icon offers a save option. That is not an unusual page — it is how most icon systems ship.',
    posterAlt:
      'The SVG Downloader popup previewing a heart icon on a page whose right-click menu offers no save option.',

    bodyEyebrow: 'The actual reason',
    bodyHeading: 'The browser only offers to save things it can fetch',
    body: `
  <p class="lead-in"><em>Save image as…</em> appears when the browser has an image with an address it can request. That is a narrower category than it looks, and modern icon systems fall outside it almost entirely. There are four places an SVG hides on a page, and only one of them plays nicely.</p>
  <ul>
    <li><strong>Inline <code>&lt;svg&gt;</code>.</strong> The markup is written straight into the HTML. No <code>src</code>, no URL, nothing to fetch — so the menu offers nothing. This is how the great majority of icons ship today. <a href="/features/inline-svg">How it is read →</a></li>
    <li><strong>CSS <code>background-image</code>.</strong> The vector is set in a stylesheet, often as an inline <code>data:</code> URI. The browser files it under decoration rather than content. <a href="/features/css-background-svg">How it is read →</a></li>
    <li><strong>Sprite <code>&lt;use&gt;</code> references.</strong> One hidden sprite holds every icon; each place an icon appears is just a pointer into it. Saving the pointer gives you an empty file. <a href="/features/svg-sprite-extractor">How it is read →</a></li>
    <li><strong><code>&lt;img&gt;</code> and <code>&lt;object&gt;</code> sources.</strong> The friendly case — and even here the source may be a <code>data:</code> URI the save dialog mangles, or a cross-origin URL that saves under a meaningless name.</li>
  </ul>
  <p>So three of the four cannot be saved that way even in principle. Reading the DOM works on all four, because by then every one of them has been resolved into actual markup by the browser itself.</p>`,

    stepsHeading: 'Saving it anyway',
    stepsIntro: 'You do not need to know which of the four you are looking at. That is the point.',
    steps: [
      {
        name: 'Leave the right-click menu alone',
        text: 'If <em>Save image as…</em> is missing or greyed out, no amount of retrying will summon it. The absence is information, not a fault.',
      },
      {
        name: 'Open the popup',
        text: 'Click the toolbar button on the page. The scan resolves all four sources into standalone markup — inline, CSS background, sprite reference and image source alike.',
      },
      {
        name: 'Preview to identify the right one',
        text: 'The isolated preview is the fastest way to distinguish two similar icons, especially in a set where the page shows them at 16px.',
      },
      {
        name: 'Name it and save',
        text: 'Type a filename and press <em>Download current</em>. The namespace is repaired on the way out, so the file opens in Figma, Illustrator and every browser.',
      },
    ],

    after: `
  <h2>Things that look like fixes but are not</h2>
  <ul>
    <li><strong>Screenshotting it.</strong> This converts a resolution-independent vector into a fixed grid of pixels, permanently. It will blur the moment anyone scales it, and it cannot be recoloured. <a href="/compare/svg-downloader-vs-screenshotting-icons">The full comparison →</a></li>
    <li><strong>Copying markup out of DevTools.</strong> This does work, but it is fiddly, and the markup you copy is missing the <code>xmlns</code> namespace, so the resulting file will not open until you add it by hand. If you want the markup rather than a file, <a href="/tutorials/copy-svg-from-website">Copy code</a> does the same job with the namespace already fixed.</li>
    <li><strong>Hunting for the file in the Network tab.</strong> Fine for <code>&lt;img&gt;</code> sources. Useless for the other three, because no request was ever made — the markup arrived inside the HTML document.</li>
  </ul>`,

    facts: [
      ['Why it fails', 'Three of the four SVG sources have <strong>no fetchable address</strong>.'],
      ['What works', 'Reading the rendered DOM, where all four have resolved to real markup.'],
      ['Bonus', 'The missing <code>xmlns</code> is repaired, so the file actually opens.'],
      [
        'Also see',
        '<a href="/tutorials/grab-svg-from-website">A faster one-icon route</a> · <a href="/features/inline-svg">Inline SVG</a>',
      ],
    ],

    faq: [
      {
        q: 'Why is Save image as… greyed out on an SVG?',
        a: 'Because the browser does not classify that element as a fetchable image. Inline SVG markup, CSS background images and sprite references have no address behind them, so there is nothing for the menu item to act on.',
      },
      {
        q: 'Is there a browser setting that turns this on?',
        a: 'No. It is not a permission or a preference — the menu item is absent because the underlying thing genuinely is not a saveable image resource. Reading the page is the way around it.',
      },
      {
        q: 'Can I just take a screenshot instead?',
        a: 'You can, but you lose the entire point of a vector. A screenshot is a fixed grid of pixels that blurs when scaled and cannot be recoloured. The saved SVG stays sharp at any size and can be restyled.',
      },
      {
        q: 'What about copying the markup from DevTools?',
        a: 'That works, but the markup you copy usually lacks the xmlns namespace, so the file will not open until you add it by hand. The extension repairs that automatically.',
      },
      {
        q: 'Does this work on every website?',
        a: 'On any page you can open in Chrome 88+, Edge or Brave. It cannot reach browser-internal pages, extension galleries, or content behind a login you do not have.',
      },
    ],

    ctaHeading: 'The menu said no. Take it anyway.',
    ctaSub: 'Four hiding places, one scan, and a file that actually opens.',
    related: [
      ['/tutorials/grab-svg-from-website', 'Right-click grab', 'The menu item that works'],
      ['/compare/svg-downloader-vs-screenshotting-icons', 'Vs. screenshotting', 'Why vector wins'],
      ['/tutorials/copy-svg-from-website', 'Copy the code', 'No file needed'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 05 ──
  {
    slug: 'copy-svg-from-website',
    cardTag: 'Clipboard',
    cardTitle: 'Copy an SVG from a website',
    cardBlurb:
      'Two clipboards, two jobs: the markup for your codebase, or a PNG picture for a doc or a chat message. Neither one touches your disk.',

    title: 'How to Copy an SVG From a Website (Code or Image)',
    description:
      'Copy an SVG straight to your clipboard — the markup for pasting into a component, or a PNG for pasting into docs and chat. No file saved, no DevTools needed.',
    crumb: 'Copy from a website',
    eyebrow: 'Tutorial — straight to the clipboard',
    h1: 'How to <span class="plot">copy an SVG</span> from a website',
    lede: 'Sometimes you do not want a file at all — you want the markup in your editor, or the picture in a Slack message. Both are one click, and they are different clicks.',

    videoHeading: 'Both clipboards, in one run',
    videoTag: 'tutorial · clipboard',
    videoName: 'Copy an SVG from a website as code or as a picture',
    videoDescription:
      'The SVG Downloader popup pages to a star icon, presses Copy code and reports SVG code copied to clipboard, then presses Copy image and reports PNG image copied to clipboard.',
    videoCaption:
      '<em>Copy code</em> gives you markup. <em>Copy image</em> gives you a PNG. The status line confirms each one.',
    videoIntro:
      'Watch the status line change between the two presses — the popup tells you exactly which of the two clipboards you just filled.',
    posterAlt:
      'The SVG Downloader popup with the Copy code and Copy image buttons below the preview.',

    bodyEyebrow: 'Pick the right one',
    bodyHeading: 'Copy code and Copy image are not alternatives — they are different things',
    body: `
  <p class="lead-in">They sit next to each other in the popup and it is worth being clear about what each one puts on your clipboard, because pasting the wrong one is a confusing five minutes.</p>
  <ul>
    <li><strong>Copy code</strong> puts the <em>markup</em> on your clipboard as text: <code>&lt;svg viewBox="0 0 24 24"&gt;…&lt;/svg&gt;</code>, sanitised, with the <code>xmlns</code> namespace already added. Paste it into a React component, a Vue template, an HTML file or a text editor. Paste it into Slack and you will get a wall of angle brackets, because it is text.</li>
    <li><strong>Copy image</strong> rasterises the vector to a <em>PNG</em> and puts that on your clipboard as a picture. Paste it into Google Docs, Notion, Figma, Slack, an email — anywhere that accepts a pasted image. It is rendered at 2× minimum so it does not arrive as a blurry thumbnail.</li>
  </ul>
  <p>Rule of thumb: if the destination is code, use <em>Copy code</em>. If the destination is a document, use <em>Copy image</em>.</p>`,

    stepsHeading: 'Copying an icon',
    stepsIntro: 'Both routes share the first two steps.',
    steps: [
      {
        name: 'Open the popup and find the icon',
        text: 'Click the toolbar button and page through with <em>Prev</em> and <em>Next</em> until the preview shows the one you want.',
      },
      {
        name: 'For code, press Copy code',
        text: 'The status line reads <em>SVG code copied to clipboard.</em> You now have sanitised markup, namespace included, ready to paste into a component.',
      },
      {
        name: 'For a picture, press Copy image',
        text: 'The status line reads <em>PNG image copied to clipboard.</em> The vector is rendered on your machine at 2× or better and put on the clipboard as an image.',
      },
      {
        name: 'Paste it where it is going',
        text: 'Markup into your editor; the PNG into your document, deck or chat. Nothing was written to disk either way.',
      },
    ],

    after: `
  <h2>What the copied markup has already had done to it</h2>
  <p>This is the part that makes it better than copying out of DevTools. Before it reaches your clipboard, the markup is run through the same sanitiser every download uses: the <code>xmlns</code> namespace is added if it was missing, so the fragment stands alone as a valid document; and script elements, event handler attributes and external references are stripped, so you are not pasting somebody else's page behaviour into your codebase. What you paste is the shapes, and only the shapes.</p>

  <h2>Pasting into a component</h2>
  <p>Two small things will bite you in JSX. Attributes like <code>stroke-width</code> and <code>fill-rule</code> need to become <code>strokeWidth</code> and <code>fillRule</code>; most editors and codemods will do this for you. And if the icon uses <code>currentColor</code> — most do — then it will take the colour of whatever text colour is in scope, which is usually exactly what you want. If it renders black and you expected a colour, that is why: the colour lived in the page's CSS, not in the shape.</p>

  <h2>Why the clipboard needs no extra permission</h2>
  <p>Both buttons write to the clipboard from inside a click you made, in a focused extension page. That is precisely the condition under which browsers allow clipboard writes, so the extension does not request a clipboard permission at all — it just uses the gesture you already gave it.</p>`,

    facts: [
      [
        'Copy code',
        'Sanitised <strong>markup</strong>, <code>xmlns</code> included — for editors and components.',
      ],
      ['Copy image', 'A <strong>PNG</strong> at 2× or better — for docs, decks, chat and email.'],
      ['Sanitising', 'Scripts, handlers and external references are stripped before either copy.'],
      ['Permissions', 'No clipboard permission requested — it rides the click you made.'],
    ],

    faq: [
      {
        q: 'What is the difference between Copy code and Copy image?',
        a: 'Copy code puts the SVG markup on your clipboard as text, for pasting into an editor or component. Copy image rasterises it to a PNG and puts that on your clipboard as a picture, for pasting into documents, decks and chat.',
      },
      {
        q: 'I pasted into Slack and got a wall of code.',
        a: 'You used Copy code, which is text. Use Copy image instead — it puts a PNG on the clipboard, which Slack pastes as a picture.',
      },
      {
        q: 'Is the copied markup safe to paste into my codebase?',
        a: 'It is sanitised first: script elements, event handler attributes and external references are stripped, and the xmlns namespace is added. You are pasting shapes, not somebody else’s page behaviour.',
      },
      {
        q: 'Why is the pasted icon black in my app?',
        a: 'Because it uses currentColor, so it inherits colour from CSS rather than carrying its own. Set a colour on the element or its parent and the icon follows it.',
      },
      {
        q: 'Do I need to grant a clipboard permission?',
        a: 'No. Both buttons write from a user click in a focused extension page, which browsers allow without any extra permission, so none is requested.',
      },
    ],

    ctaHeading: 'Two clipboards, no files',
    ctaSub: 'Markup for the editor, a PNG for the document. Pick a button.',
    related: [
      ['/tutorials/download-svg-from-html', 'From the HTML', 'Without DevTools'],
      ['/tutorials/download-svg-image-from-website', 'Convert to PNG', 'When you need a raster'],
      ['/tutorials/how-to-download-svg-files', 'Save a file instead', 'The basics'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 06 ──
  {
    slug: 'extract-svg-from-website',
    cardTag: 'The whole set',
    cardTitle: 'Extract every SVG from a website',
    cardBlurb:
      'One scan, one ZIP, de-duplicated and numbered — and an honest status line naming anything that could not be resolved.',

    title: 'Extract Every SVG From a Website in One Pass',
    description:
      'Scan a page once and take every vector it renders as a de-duplicated, numbered ZIP — inline icons, CSS backgrounds, sprites and image sources together.',
    crumb: 'Extract every SVG',
    eyebrow: 'Tutorial — the whole set at once',
    h1: 'How to <span class="plot">extract every SVG</span> from a website',
    lede: 'Paging through forty icons one at a time is nobody’s afternoon. One scan finds them all; one click takes them all.',

    videoHeading: 'One scan, one ZIP',
    videoTag: 'tutorial · bulk',
    videoName: 'Extract every SVG on a website in one pass',
    videoDescription:
      'The SVG Downloader popup scans a page and reports 24 found, pages through several previews to check the set, then presses Download all as ZIP and reports Downloaded 24 SVGs as ZIP.',
    videoCaption:
      'Check the set in the preview first, then take all twenty-four in a single click.',
    videoIntro:
      'The paging in the middle is not padding — it is the step most people skip and then regret, because it is your only chance to see what you are about to take.',
    posterAlt: 'The SVG Downloader popup mid-scan with the counter reading 24 found.',

    bodyEyebrow: 'What one pass actually collects',
    bodyHeading: 'Four sources, resolved into one folder',
    body: `
  <p class="lead-in">The scan does not look for <code>.svg</code> files. It reads the rendered page and resolves every vector it can reach into standalone markup, which is why the count is usually higher than the number of obvious icons on screen.</p>
  <ul>
    <li><strong>Inline <code>&lt;svg&gt;</code> elements</strong> — the bulk of any modern icon set, plus the logo and most of the UI chrome.</li>
    <li><strong>CSS <code>background-image</code> vectors</strong>, including inline <code>data:</code> URIs read out of the stylesheet.</li>
    <li><strong>Same-document sprite <code>&lt;use&gt;</code> references</strong>, resolved back to the symbol they point at so each one becomes a real, self-contained file.</li>
    <li><strong><code>&lt;img&gt;</code> and <code>&lt;object&gt;</code> sources</strong>, fetched and inlined.</li>
  </ul>
  <p>Duplicates are collapsed before the ZIP is built. A page that renders the same chevron in nineteen places gives you one chevron, not nineteen — which is the difference between a usable folder and a mess.</p>`,

    stepsHeading: 'Taking the set',
    stepsIntro: 'Four steps, and the third is the one worth not skipping.',
    steps: [
      {
        name: 'Open the popup on the page',
        text: 'Click the toolbar button. The counter reports how many distinct vectors the page renders.',
      },
      {
        name: 'Rescan if the page changed',
        text: 'If you have since opened a menu, switched a tab or scrolled a lazy-loading grid into view, press the rescan button in the header so the new icons are included.',
      },
      {
        name: 'Page through to check the set',
        text: 'Walk it with <em>Prev</em> and <em>Next</em>. Thirty seconds here tells you whether you are about to get the icon set you wanted or the icon set plus every decorative flourish on the page.',
      },
      {
        name: 'Press Download all as ZIP',
        text: 'The whole set is bundled, de-duplicated and numbered. The status line reports how many were saved — and names anything that could not be extracted standalone rather than dropping it silently.',
      },
    ],

    after: `
  <h2>Read the status line</h2>
  <p>When everything resolves, you get a plain <em>Downloaded 24 SVGs as ZIP.</em> When something does not, you get the count that succeeded <em>and the names of the ones that did not</em> — because a bulk tool that quietly drops files is worse than one that fails loudly. The usual reasons a vector cannot be extracted standalone are a sprite reference pointing at a different document the page never loaded, or an image source on a domain that refuses cross-origin reads.</p>

  <h2>Very large pages</h2>
  <p>Scanning every stylesheet on a page with thousands of rules is expensive, so CSS background scanning is bounded. If that bound is hit you will see <em>This page is too large to scan CSS backgrounds — other SVGs still found</em>, which means inline elements, sprites and image sources were all still collected. In practice CSS-background vectors are the rarest of the four, so this is a small loss on a page where the alternative is a hung tab.</p>

  <h2>Naming what comes out</h2>
  <p>Files in the ZIP are numbered from a prefix you can change in the extension's settings, along with the ZIP's own name. If you routinely pull sets from different sites, setting a prefix per project is quicker than renaming twenty files afterwards.</p>`,

    facts: [
      [
        'One pass',
        'Inline, CSS background, sprite <code>&lt;use&gt;</code> and image sources — <strong>together</strong>.',
      ],
      ['De-duplicated', 'The same icon rendered nineteen times arrives <strong>once</strong>.'],
      [
        'Honest',
        'Anything that could not be resolved is <strong>named in the status line</strong>.',
      ],
      [
        'Also see',
        '<a href="/features/bulk-zip-download">The bulk feature</a> · <a href="/tutorials/download-svg-from-webpage">Page inventory</a>',
      ],
    ],

    faq: [
      {
        q: 'Does it get every SVG on the page?',
        a: 'Every one it can resolve into a standalone file: inline elements, CSS background images, same-document sprite references, and img or object sources. Anything it cannot resolve is named in the status line rather than dropped silently.',
      },
      {
        q: 'Will I get the same icon twenty times?',
        a: 'No. Duplicates are collapsed before the ZIP is built, so a chevron rendered in nineteen places arrives once.',
      },
      {
        q: 'Some icons appeared only after I scrolled.',
        a: 'Lazy-loaded content is not in the DOM until it renders. Scroll it into view, then press the rescan button in the popup header to pick it up.',
      },
      {
        q: 'What does "too large to scan CSS backgrounds" mean?',
        a: 'The page has enough CSS that scanning all of it would hang the tab, so that one source was skipped. Inline elements, sprites and image sources were still collected.',
      },
      {
        q: 'Can I change the file names in the ZIP?',
        a: 'Yes — the numbering prefix and the ZIP name are both set in the extension’s settings.',
      },
    ],

    ctaHeading: 'Take the whole set in one click',
    ctaSub: 'De-duplicated, numbered, and honest about anything it could not reach.',
    related: [
      ['/features/bulk-zip-download', 'The ZIP feature', 'How it bundles'],
      ['/tutorials/download-svg-from-webpage', 'Page inventory', 'Count before you take'],
      ['/tutorials/extract-svg-logo-from-website', 'Just the logo', 'One vector, full size'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 07 ──
  {
    slug: 'grab-svg-from-website',
    cardTag: 'Fastest route',
    cardTitle: 'Grab one SVG in a right-click',
    cardBlurb:
      'No popup, no scan, no paging. Right-click the icon, take “Save this as SVG”, done — with the same sanitiser running underneath.',

    title: 'SVG Grabber — Grab One SVG in a Single Right-Click',
    description:
      'Skip the popup entirely. Right-click any graphic and take “Save this as SVG” to grab exactly the one you clicked, sanitised and ready to open.',
    crumb: 'Grab one fast',
    eyebrow: 'Tutorial — the fastest route',
    h1: 'How to <span class="plot">grab an SVG</span> in one right-click',
    lede: 'When you want one specific icon and you want it now, opening a popup and paging to it is three steps too many. There is a one-step route.',

    videoHeading: 'One menu item, one file',
    videoTag: 'tutorial · right-click',
    videoName: 'Grab one SVG fast with the right-click menu',
    videoDescription:
      'An icon on a page is right-clicked. Chrome’s page menu opens with a Save this as SVG item contributed by the extension. It is selected, and the file is saved.',
    videoCaption:
      'The menu is Chrome’s. The last item is the extension’s. That is the whole interaction.',
    videoIntro:
      'Look at the menu in the recording: there is no <em>Save image as…</em> in it, because an inline <code>&lt;svg&gt;</code> is not an image. The extension’s row is the only thing there that can save the vector.',
    posterAlt: 'Chrome’s right-click menu open over an icon, showing the Save this as SVG item.',

    bodyEyebrow: 'When to use which',
    bodyHeading: 'Right-click for one, the popup for a decision',
    body: `
  <p class="lead-in">Both routes end with the same file, produced by the same code. They differ in what you have to know first.</p>
  <ul>
    <li><strong>Right-click</strong> when you already know exactly which graphic you want and you are looking straight at it. You point at it; there is no list, no paging and no ambiguity. This is the fastest possible route to a single file.</li>
    <li><strong>The popup</strong> when you do not know yet — when you want to see the isolated preview, compare two similar icons, choose a filename, convert to PNG, copy the markup, or take the whole page at once. It is the route with options.</li>
  </ul>
  <p>Notably, right-click needs no scan at all. Nothing walks the page, nothing is counted, and there is no list to build — the extension is handed the element you clicked and works on that one thing.</p>`,

    stepsHeading: 'Grabbing one',
    stepsIntro: 'There are two steps and one of them is “right-click”.',
    steps: [
      {
        name: 'Right-click the graphic',
        text: 'Point at the icon, logo or illustration you want and right-click it. It works on inline vectors, on images, and on graphics painted as CSS backgrounds.',
      },
      {
        name: 'Choose “Save this as SVG”',
        text: 'The extension’s item sits in its own group below Chrome’s own entries. Choosing it finds the graphic under your cursor, resolves it, sanitises it, and saves it — no popup opens at any point.',
      },
    ],

    after: `
  <h2>It is the same file, not a shortcut version</h2>
  <p>The heavy work happens in the same place either way. The service worker behind the menu item has no DOM of its own, so it asks the page's content script for a finished, sanitised file and hands that to the browser's download machinery. That is the identical path a popup download takes — the same namespace repair, the same stripping of scripts and event handlers. You are not trading quality for speed.</p>

  <h2>Where the menu item will not appear</h2>
  <p>It is registered for ordinary web pages only — <code>http</code> and <code>https</code>. You will not see it on <code>chrome://</code> pages, on the Chrome Web Store or other extension galleries, or on PDFs and other non-HTML documents. Browsers block extensions on their own gallery pages deliberately, and no extension can work around that.</p>

  <h2>If the icon comes from a sprite</h2>
  <p>Sprite <code>&lt;use&gt;</code> references that point into the same document resolve immediately. One that points at a separate sprite file the page has not loaded needs fetching first, so it may take a moment longer — or, if that file is unreachable, fail. In that case open the popup and take it from the scan, which has more room to resolve it.</p>`,

    facts: [
      ['Steps', '<strong>Two.</strong> Right-click, then choose the item. No popup, no scan.'],
      ['Quality', 'Identical to a popup download — same sanitiser, same namespace repair.'],
      [
        'Works on',
        'Inline vectors, images and CSS-background graphics on any <code>http(s)</code> page.',
      ],
      [
        'Use the popup for',
        'Previewing, renaming, PNG conversion, copying, or the whole page at once.',
      ],
    ],

    faq: [
      {
        q: 'Where is the "Save this as SVG" menu item?',
        a: 'In the right-click menu on any ordinary web page, in its own group below Chrome’s own items. Extension-contributed items always sit below the built-ins.',
      },
      {
        q: 'Is the file any different from a popup download?',
        a: 'No. Both run the same sanitiser and the same namespace repair — the right-click route simply skips the scan and the preview.',
      },
      {
        q: 'The menu item is missing on this page.',
        a: 'It is registered for http and https pages only. Browser-internal pages, the Chrome Web Store, other extension galleries and PDFs are all off-limits to extensions by design.',
      },
      {
        q: 'Can I right-click a CSS background image?',
        a: 'Yes. The item is offered on both image and general page targets, so inline vectors and CSS backgrounds are both reachable.',
      },
      {
        q: 'Nothing downloaded when I clicked it.',
        a: 'Most often the graphic under the cursor was a sprite reference pointing at a separate file the page never loaded, so there was nothing to resolve. Open the popup and take it from the scan instead.',
      },
    ],

    ctaHeading: 'One icon, one right-click',
    ctaSub: 'The fastest route there is — and the file is exactly the same.',
    related: [
      ['/tutorials/save-svg-from-website', 'When right-click fails', 'The greyed-out menu'],
      ['/tutorials/how-to-download-svg-files', 'The popup route', 'With previews and options'],
      ['/tutorials/download-svg-from-link', 'From a link', 'Save link as… lies'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 08 ──
  {
    slug: 'download-svg-from-webpage',
    cardTag: 'Inventory',
    cardTitle: 'Download the SVGs on a webpage',
    cardBlurb:
      'Find out what a page actually contains before you take anything — the count is almost always higher than it looks.',

    title: 'Download the SVGs on a Webpage — Take an Inventory First',
    description:
      'Count every vector a webpage renders, page through to see what they are, then take the ones you want or the whole set. Nothing is dropped silently.',
    crumb: 'Whole-page inventory',
    eyebrow: 'Tutorial — count first, take second',
    h1: 'How to <span class="plot">download the SVGs on a webpage</span>',
    lede: 'Most pages carry two or three times more vector graphics than you would guess from looking at them. Counting first is how you avoid a download folder full of decorative flourishes.',

    videoHeading: 'Count, check, then take',
    videoTag: 'tutorial · inventory',
    videoName: 'Take an inventory of every SVG on a webpage',
    videoDescription:
      'The SVG Downloader popup scans a webpage, the counter climbs to 24 found, the previews are paged through to review the set, and the whole page is then saved as a ZIP.',
    videoCaption: 'The counter is the inventory. The preview is the audit. The ZIP is the take.',
    videoIntro:
      'The counter climbing from zero is the page telling you what it is actually made of — and it is rarely the number people guess.',
    posterAlt: 'The SVG Downloader popup counter reading 24 found on a webpage of icons.',

    bodyEyebrow: 'Why the number surprises people',
    bodyHeading: 'A page renders far more vectors than it appears to',
    body: `
  <p class="lead-in">When you look at a page you see the content. The scan sees everything the browser drew, and a modern page draws vectors constantly in places you would never count.</p>
  <ul>
    <li><strong>The logo</strong>, almost always inline <code>&lt;svg&gt;</code> these days rather than an image file.</li>
    <li><strong>UI chrome</strong> — the search magnifier, the menu bars, the close crosses, every chevron in every dropdown.</li>
    <li><strong>Social and payment marks</strong> in the footer, usually a dozen of them.</li>
    <li><strong>Decorative shapes</strong> — section dividers, blob backgrounds, illustration fragments, drawn as CSS background vectors.</li>
    <li><strong>Icons in components that are not currently visible</strong>, like a closed menu that is already in the DOM.</li>
  </ul>
  <p>That is why counting before taking is worth thirty seconds: a page that looks like it has six icons often reports twenty-four, and knowing which is which before you build a ZIP saves you sorting it out afterwards.</p>`,

    stepsHeading: 'Taking an inventory',
    stepsIntro:
      'The order matters here — the point is to know what you have before you commit to it.',
    steps: [
      {
        name: 'Get the page into the state you want to capture',
        text: 'Scroll lazy-loading sections into view; open the menu if the icons you want live inside it. The scan reads the DOM as it stands, so anything not yet rendered is not yet there.',
      },
      {
        name: 'Open the popup and read the counter',
        text: 'The counter reports the number of distinct vectors found, after duplicates have been collapsed. That is your inventory.',
      },
      {
        name: 'Page through the previews',
        text: '<em>Prev</em> and <em>Next</em>, with the pager showing your position in the set. This is where you find out that eight of the twenty-four are footer payment marks.',
      },
      {
        name: 'Take what you want',
        text: 'Either name and download individual vectors as you find them, or press <em>Download all as ZIP</em> for the lot. The status line reports what was saved and names anything it could not resolve.',
      },
    ],

    after: `
  <h2>Rescan after you change the page</h2>
  <p>The scan is a snapshot, not a live feed. If you open a modal, switch a tab, expand an accordion or scroll a lazy grid into view after scanning, those new vectors are not in the list yet. The rescan button in the popup header re-reads the page as it stands now. This is the single most common reason someone reports that an icon is "missing" — it genuinely was not in the DOM when the scan ran.</p>

  <h2>What the counter does not include</h2>
  <p>Vectors inside cross-origin <code>&lt;iframe&gt;</code>s are not counted, because the browser's same-origin policy means the page itself cannot read them either — an embedded map or a payment widget is a different document under different rules. Anything rendered to a <code>&lt;canvas&gt;</code> is not counted either, since by then it has become pixels and there is no vector left to extract.</p>`,

    facts: [
      [
        'The counter',
        'Distinct vectors <strong>after de-duplication</strong> — not raw element count.',
      ],
      [
        'Snapshot',
        'Reads the DOM as it stands. <strong>Rescan</strong> after you change the page.',
      ],
      [
        'Not counted',
        'Cross-origin iframes and anything already rasterised to a <code>&lt;canvas&gt;</code>.',
      ],
      [
        'Also see',
        '<a href="/tutorials/extract-svg-from-website">Take the whole set</a> · <a href="/features/bulk-zip-download">The ZIP feature</a>',
      ],
    ],

    faq: [
      {
        q: 'Why does it find more SVGs than I can see?',
        a: 'Because a page draws vectors in places you would not count them: the logo, every chevron and close cross, footer social and payment marks, decorative dividers, and icons inside components that are in the DOM but not currently visible.',
      },
      {
        q: 'An icon I can see is not in the list.',
        a: 'It probably rendered after the scan ran — lazy-loaded content, a modal you opened, a tab you switched. Press the rescan button in the popup header to re-read the page as it stands now.',
      },
      {
        q: 'Does it read SVGs inside an iframe?',
        a: 'Not cross-origin ones. The same-origin policy means the page itself cannot read into an embedded map or payment widget, and neither can anything running in the page.',
      },
      {
        q: 'What about graphics drawn on a canvas?',
        a: 'Those are already pixels by the time they are drawn, so there is no vector left to extract. A canvas graphic can only ever be captured as a raster.',
      },
      {
        q: 'Can I download just some of them?',
        a: 'Yes — page to each one and use Download current, naming each as you go. Download all as ZIP is there for when you want the lot.',
      },
    ],

    ctaHeading: 'Find out what the page is actually made of',
    ctaSub: 'Count first, check the previews, then take exactly what you want.',
    related: [
      ['/tutorials/extract-svg-from-website', 'Take the whole set', 'One ZIP'],
      ['/tutorials/extract-svg-logo-from-website', 'Just the logo', 'One vector'],
      ['/features/bulk-zip-download', 'The ZIP feature', 'How it bundles'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 09 ──
  {
    slug: 'download-svg-from-html',
    cardTag: 'For developers',
    cardTitle: 'Pull an SVG out of the HTML',
    cardBlurb:
      'The DevTools route, without DevTools — and with the missing xmlns already repaired, which is the part that trips everyone up.',

    title: 'Download an SVG From HTML Without Opening DevTools',
    description:
      'Get inline SVG markup out of a page’s HTML as a working file or as clipboard-ready code, with the xmlns namespace repaired and scripts stripped.',
    crumb: 'From the HTML',
    eyebrow: 'Tutorial — for people who read source',
    h1: 'How to <span class="plot">download an SVG from HTML</span>',
    lede: 'You can absolutely do this by hand in DevTools. You will also spend ten minutes working out why the file you saved refuses to open — so here is both the manual route and the reason it bites.',

    videoHeading: 'Markup out, without the Elements panel',
    videoTag: 'tutorial · html source',
    videoName: 'Pull an SVG out of the HTML without opening DevTools',
    videoDescription:
      'The SVG Downloader popup finds an inline SVG in a page’s HTML, presses Copy code to put the sanitised markup on the clipboard, then saves the same vector as a file.',
    videoCaption:
      'Same markup DevTools would show you — with the namespace added and the scripts stripped.',
    videoIntro:
      'Both exits are shown here: the markup to the clipboard, and the same vector as a file. The difference between them is only where it ends up.',
    posterAlt:
      'The SVG Downloader popup with Copy code ready to lift inline markup from a page’s HTML.',

    bodyEyebrow: 'The manual route, and its one trap',
    bodyHeading: 'Copy-pasting from Elements gives you a file that will not open',
    body: `
  <p class="lead-in">The hand method is straightforward: open DevTools, find the <code>&lt;svg&gt;</code> element in the Elements panel, right-click it, choose <em>Copy → Copy outerHTML</em>, paste into a new file, save as <code>.svg</code>. Then double-click it and your browser shows you an error or a blank page.</p>
  <p>The reason is a namespace. A standalone SVG document must declare <code>xmlns="http://www.w3.org/2000/svg"</code> on its root element. Inline SVG almost never has that attribute, because the HTML parser puts elements into the SVG namespace automatically based on where they appear — the attribute is genuinely unnecessary <em>inside</em> HTML. Lift the markup out of that context and it becomes necessary, and it is not there.</p>
  <p>So the manual fix is real but easy to forget: add the <code>xmlns</code> attribute to the root <code>&lt;svg&gt;</code> tag yourself, every time. There are two other things worth doing while you are in there, and they are less obvious.</p>
  <ul>
    <li><strong>Strip anything executable.</strong> Page markup can carry <code>&lt;script&gt;</code> elements, <code>on*</code> event handler attributes and external references. You do not want those in a file you are about to check into a repository or open in a design tool.</li>
    <li><strong>Check for <code>currentColor</code>.</strong> If the icon inherits its colour from CSS, the extracted file has no colour of its own and will render black. That is correct behaviour, not corruption.</li>
  </ul>`,

    stepsHeading: 'The route that does all three for you',
    stepsIntro:
      'Namespace repair, sanitising and a choice of exits — without leaving the page or opening a panel.',
    steps: [
      {
        name: 'Open the popup on the page',
        text: 'Click the toolbar button. Every inline <code>&lt;svg&gt;</code> in the document is collected, along with CSS background vectors, sprite references and image sources.',
      },
      {
        name: 'Find the element you want',
        text: 'Page with <em>Prev</em> and <em>Next</em>. The isolated preview is considerably easier to match against than a highlighted node in the Elements tree.',
      },
      {
        name: 'Take it as markup, or as a file',
        text: '<em>Copy code</em> puts the sanitised markup on your clipboard, namespace included, ready to paste into a component. <em>Download current</em> writes the same thing to a <code>.svg</code> file.',
      },
      {
        name: 'Paste or open it',
        text: 'Either way the result is a valid standalone document — it opens in Figma, Illustrator, VS Code and every browser without editing.',
      },
    ],

    after: `
  <h2>What view-source will and will not show you</h2>
  <p>View-source shows the HTML the server sent. That is not the same document as the one on your screen. Anything a framework rendered on the client — which, on a React, Vue or Svelte site, is most of the icons — never appears in view-source at all. The DOM is the honest record of what the page is, and it is what both DevTools and this extension read.</p>

  <h2>Sprites are the other reason hand-copying disappoints</h2>
  <p>Copy the outerHTML of a sprite-based icon and you get roughly <code>&lt;svg&gt;&lt;use href="#star"/&gt;&lt;/svg&gt;</code> — a pointer, not a shape. Saved as a file it renders nothing at all, because the symbol it points at lived in a different part of the document you did not copy. Resolving that reference back to its symbol is one of the things the scan does for you. <a href="/features/svg-sprite-extractor">More on sprites →</a></p>

  <h2>If you want a build-time pipeline instead</h2>
  <p>For extracting icons as part of a build, this is the wrong tool and a headless browser is the right one — drive the page, read the DOM, write the files. The extension is for the interactive case: you are looking at a page and you want that icon now.</p>`,

    facts: [
      [
        'The trap',
        'Inline SVG omits <code>xmlns</code>, so hand-copied markup <strong>will not open</strong>.',
      ],
      ['Repaired', 'The namespace is added and scripts, handlers and external refs are stripped.'],
      [
        'Sprites',
        '<code>&lt;use&gt;</code> pointers are resolved back to the symbol — not saved as pointers.',
      ],
      [
        'View-source',
        'Shows the server’s HTML, <strong>not</strong> what a framework rendered on the client.',
      ],
    ],

    faq: [
      {
        q: 'Why will not the SVG I copied from DevTools open?',
        a: 'It is missing the xmlns="http://www.w3.org/2000/svg" attribute. Inline SVG does not need it because the HTML parser supplies the namespace, but a standalone .svg document does. Add it to the root tag, or let the extension repair it for you.',
      },
      {
        q: 'Can I get the SVG from view-source?',
        a: 'Only if the server sent it. Anything rendered on the client by React, Vue or Svelte never appears in view-source. The DOM is what actually got drawn, and that is what the scan reads.',
      },
      {
        q: 'I copied a sprite icon and the file is blank.',
        a: 'You copied a <code>&lt;use&gt;</code> pointer rather than the shape it points at. The symbol lives elsewhere in the document. The scan resolves that reference back to the real symbol so you get a self-contained file.',
      },
      {
        q: 'Is the extracted markup modified?',
        a: 'Only in ways that make it a valid standalone file: the xmlns namespace is added, and script elements, event handler attributes and external references are stripped. The shapes are untouched.',
      },
      {
        q: 'Can I automate this in a build?',
        a: 'Not with the extension — use a headless browser for that. This is for the interactive case where you are looking at a page and want the icon now.',
      },
    ],

    ctaHeading: 'Skip the panel, keep the markup',
    ctaSub: 'Namespace repaired, scripts stripped, sprites resolved.',
    related: [
      ['/tutorials/copy-svg-from-website', 'Copy the code', 'Clipboard, not disk'],
      ['/features/svg-sprite-extractor', 'Sprite extraction', 'Resolving &lt;use&gt;'],
      ['/features/inline-svg', 'Inline SVG', 'How the DOM read works'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 10 ──
  {
    slug: 'extract-svg-logo-from-website',
    cardTag: 'Logos',
    cardTitle: 'Extract a logo as a vector',
    cardBlurb:
      'Get a company mark at full fidelity instead of a blurry header screenshot — plus the licensing question you should ask first.',

    title: 'Extract an SVG Logo From a Website at Full Quality',
    description:
      'Pull a company logo off a page as a real vector — sharp at any size, recolourable, print-ready. Includes where logos hide and what you may legally do with one.',
    crumb: 'Extract a logo',
    eyebrow: 'Tutorial — brand marks',
    h1: 'How to <span class="plot">extract an SVG logo</span> from a website',
    lede: 'A logo screenshotted from a header is 180 pixels wide forever. The same logo as a vector is sharp on a business card and on the side of a building.',

    videoHeading: 'The mark, at full fidelity',
    videoTag: 'tutorial · logos',
    videoName: 'Extract a company logo from a website as a real vector',
    videoDescription:
      'The SVG Downloader popup scans a site, pages through to the company wordmark, takes the filename vectorly-logo, and downloads the logo as a vector file.',
    videoCaption:
      'Named properly on the way out, because <code>svg-7.svg</code> helps nobody six months from now.',
    videoIntro:
      'The naming step matters more for logos than for anything else — a brand folder full of numbered files is a brand folder nobody uses.',
    posterAlt:
      'The SVG Downloader popup previewing a company wordmark extracted from a website header.',

    bodyEyebrow: 'Before the how',
    bodyHeading: 'A logo is somebody’s trademark, and extraction is not permission',
    body: `
  <p class="lead-in">This is worth two minutes because getting it wrong is expensive. Being able to save a mark and being allowed to use it are unrelated questions, and the second one has nothing to do with this tool.</p>
  <p>Broadly, and this is not legal advice: using a company's logo to <strong>refer to that company</strong> — a client list, a "works with" row, a press piece, a comparison table — is generally acceptable, and most companies publish brand guidelines saying so. Using it in a way that implies <strong>endorsement, partnership or authorship</strong> is not, and neither is modifying a mark and passing it off as your own.</p>
  <p>The practical move: before you use it, look for the company's brand or press page. Most large organisations publish an official asset kit with the logo in several formats, clear-space rules, approved colourways and a short licence. That kit is both safer and usually better prepared than anything you extract — extraction is what you do when there is no kit, or when you need the mark right now for a mock-up.</p>`,

    stepsHeading: 'Extracting the mark',
    stepsIntro:
      'Logos are usually the easiest vector on any page to find, for a structural reason.',
    steps: [
      {
        name: 'Go to the home page',
        text: 'The header logo is nearly always inline <code>&lt;svg&gt;</code> — sites do this so the mark stays crisp on every screen and can be recoloured for dark mode.',
      },
      {
        name: 'Open the popup and scan',
        text: 'The logo is typically among the first few vectors found, because it sits near the top of the document.',
      },
      {
        name: 'Page to it and confirm in the preview',
        text: 'The isolated preview matters here: it shows you whether you have the full lockup, the wordmark alone, or just the symbol. Pages often contain all three.',
      },
      {
        name: 'Name it and download',
        text: 'Use a name you will recognise later — <code>acme-logo-full</code>, <code>acme-mark</code>. Then <em>Download current</em>.',
      },
    ],

    after: `
  <h2>Where the variants hide</h2>
  <p>A site usually carries more than one version of its own mark, and the one in the header may not be the one you want. Check the <strong>footer</strong>, which often has a monochrome or reversed variant. Check the <strong>mobile layout</strong> at a narrow window, which frequently swaps the full lockup for the symbol alone. And check any <strong>dark-mode</strong> toggle, which may swap in a light-on-dark version. Each of these is a separate vector and each will appear in the scan.</p>

  <h2>Why the logo came out black</h2>
  <p>If the mark uses <code>currentColor</code> so it can adapt to dark mode, the extracted file has no colour of its own and renders black. That is the true source markup. Recolour it in Figma or Illustrator, or use the hand-off to the <a href="https://clasicwebtools.com">SVG Color Changer</a>. For a brand mark specifically, check the brand guidelines for the official colour value rather than eyedropping it off a screenshot — screens lie about colour.</p>

  <h2>If the logo is a PNG</h2>
  <p>Some sites still ship a raster logo, and no tool can turn that back into a vector — the curve data is gone. Your options are the company's own brand kit, which will usually have the vector, or tracing it, which produces an approximation with slightly wrong curves that a designer will notice. Ask for the kit.</p>`,

    facts: [
      [
        'Usually',
        'The header logo is <strong>inline <code>&lt;svg&gt;</code></strong>, so it is among the first found.',
      ],
      [
        'Variants',
        'Check the footer, the mobile layout and dark mode — often three different files.',
      ],
      [
        'Legally',
        'Extraction is not permission. Look for the company’s <strong>brand kit</strong> first.',
      ],
      ['If it is a PNG', 'It cannot be converted back to a vector. Ask for the official asset.'],
    ],

    faq: [
      {
        q: 'Is it legal to download a company’s logo?',
        a: 'Downloading it is not the question — using it is. Referring to a company with its mark is generally acceptable and most publish brand guidelines saying so, but implying endorsement or partnership is not. Check the company’s brand or press page first; this is not legal advice.',
      },
      {
        q: 'Why is the logo black instead of the brand colour?',
        a: 'It uses currentColor so it can adapt to dark mode, which means the colour lives in CSS rather than in the file. Recolour it in a design tool, and take the official colour value from the brand guidelines rather than from a screenshot.',
      },
      {
        q: 'The site’s logo is a PNG. Can I get a vector?',
        a: 'Not from the PNG — the curve data does not exist in a raster. Look for the company’s brand kit, which almost always includes the vector. Tracing produces an approximation with visibly wrong curves.',
      },
      {
        q: 'I got the symbol but I wanted the full lockup.',
        a: 'Sites often carry several variants. Check the footer for a monochrome version, narrow the window to see the mobile layout, and try any dark-mode toggle — each variant appears as a separate vector in the scan.',
      },
      {
        q: 'Will the extracted logo print properly?',
        a: 'Yes. It is a real vector, so it stays sharp at any size. Confirm the colour values against the brand guidelines before sending anything to print.',
      },
    ],

    ctaHeading: 'Get the mark, not a screenshot of it',
    ctaSub: 'Sharp at any size, recolourable, and ready for print.',
    related: [
      ['/use-cases/recover-brand-assets-redesign', 'Recovering brand assets', 'A real story'],
      ['/tutorials/download-svg-from-webpage', 'Find the variants', 'Whole-page inventory'],
      ['/compare/svg-downloader-vs-screenshotting-icons', 'Vs. screenshotting', 'Why vector wins'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 11 ──
  {
    slug: 'free-svg-downloader',
    cardTag: 'Free',
    cardTitle: 'A genuinely free SVG downloader',
    cardBlurb:
      'No account, no trial, no watermark, no paid tier holding the bulk export hostage. Here is what “free” means and how it is sustainable.',

    title: 'Free SVG Downloader — No Account, No Watermark, No Limits',
    description:
      'Every feature is free: single downloads, bulk ZIP, PNG conversion and clipboard copy. MIT-licensed, on-device, no account and nothing uploaded.',
    crumb: 'Free downloader',
    eyebrow: 'Tutorial — what free means here',
    h1: 'A <span class="plot">free SVG downloader</span> with nothing held back',
    lede: '“Free” usually means free until the useful part. Here it means the bulk export, the format conversion and the clipboard are all free too, because there is no paid tier for them to live in.',

    videoHeading: 'Every feature, no gate',
    videoTag: 'tutorial · free',
    videoName: 'A free SVG downloader with nothing held back',
    videoDescription:
      'The SVG Downloader popup previews an icon, downloads it as a file, then downloads every SVG on the page as a ZIP — with no account prompt, upgrade prompt or watermark at any point.',
    videoCaption:
      'Single download, then bulk ZIP. No upgrade prompt appears, because there is nothing to upgrade to.',
    videoIntro:
      'The thing to notice is what does not happen: no sign-in wall before the ZIP, no watermark on the output, no counter of remaining free downloads.',
    posterAlt: 'The SVG Downloader popup performing a bulk ZIP download with no upgrade prompt.',

    bodyEyebrow: 'The usual catches',
    bodyHeading: 'The four places free SVG tools normally stop being free',
    body: `
  <p class="lead-in">It is a well-worn pattern, and worth naming so you can check any tool against it — including this one.</p>
  <ul>
    <li><strong>The bulk export is the paid feature.</strong> Downloading one file is free; downloading the set requires an account. Here, <em>Download all as ZIP</em> is free.</li>
    <li><strong>A daily limit.</strong> Five free downloads, then come back tomorrow. There is no limit here, and no counter, because nothing is counted — there is no server to count with.</li>
    <li><strong>A watermark or a downgrade.</strong> The free output is stamped, or quietly reduced in quality. The output here is the page's own markup, unmodified apart from the namespace repair and the security sanitising.</li>
    <li><strong>An account before you can do anything.</strong> Sign up, verify an email, then download. There is no account here at all, and nowhere to make one.</li>
  </ul>
  <p>The reason none of these apply is structural rather than generous: the extension has no server. Everything happens inside your browser, on your machine. There is no per-user cost to recover, so there is nothing to meter — and no infrastructure that would need paying for if it became popular.</p>`,

    stepsHeading: 'Using the free features',
    stepsIntro: 'Which is all of them.',
    steps: [
      {
        name: 'Install it',
        text: 'From the Chrome Web Store, for Chrome, Edge or Brave. No account, no email, no card.',
      },
      {
        name: 'Download single vectors',
        text: 'Open the popup, page to what you want, name it, press <em>Download current</em>. Unlimited.',
      },
      {
        name: 'Download the whole page as a ZIP',
        text: '<em>Download all as ZIP</em>, de-duplicated and numbered. Also unlimited, and not behind anything.',
      },
      {
        name: 'Convert and copy',
        text: 'Switch the format segment to PNG or JPG to convert on the way out, or use <em>Copy code</em> and <em>Copy image</em> for the clipboard. All free.',
      },
    ],

    after: `
  <h2>Free as in licence, too</h2>
  <p>The extension is MIT-licensed and the source is on <a href="https://github.com/Flozad/svg-downloader">GitHub</a>. You can read every line, satisfy yourself about what it does with your pages, fork it, or build it yourself and load it unpacked without going through a store at all. For anyone who is reasonably suspicious of an extension that can read the page they are on — which is a healthy instinct — that is the part that actually answers the concern, rather than a privacy policy asking you to take it on trust.</p>

  <h2>What it asks for</h2>
  <p>The permissions are worth reading in full because they are short. <code>activeTab</code> means it can see a page when you click its button, and not otherwise. <code>downloads</code> writes the files. <code>contextMenus</code> adds the right-click item. <code>scripting</code> injects the code that reads the page. <code>storage</code> keeps your settings locally. There is no host permission, so it is not running on every page you visit in the background, and its content security policy blocks it from connecting anywhere — <code>connect-src 'none'</code>, meaning it structurally cannot phone home.</p>

  <h2>Free icon sources worth knowing</h2>
  <p>If what you actually need is icons you are unambiguously licensed to use, start there rather than extracting them: <strong>Heroicons</strong> (MIT), <strong>Feather</strong> (MIT), <strong>Lucide</strong> (ISC), <strong>Bootstrap Icons</strong> (MIT), <strong>Material Symbols</strong> (Apache 2.0) and <strong>Simple Icons</strong> (CC0) all publish complete sets with clear licences. Extraction is for when you need a specific vector from a specific page — not a substitute for a properly licensed set.</p>`,

    facts: [
      ['Cost', '<strong>Free.</strong> No tier, no trial, no limit, no watermark, no account.'],
      ['Licence', '<strong>MIT.</strong> Source on GitHub — read it, fork it, build it yourself.'],
      ['Why', 'No server means no per-user cost, so there is nothing to meter.'],
      [
        'Permissions',
        '<code>activeTab</code>, downloads, contextMenus, scripting, storage. No host permission.',
      ],
    ],

    faq: [
      {
        q: 'Is the bulk ZIP download free too?',
        a: 'Yes. Every feature is free — single downloads, bulk ZIP, PNG and JPG conversion, and both clipboard copies. There is no paid tier for anything to be held back in.',
      },
      {
        q: 'Is there a daily download limit?',
        a: 'No, and there is no counter either. Nothing is counted because there is no server to count with — everything runs on your machine.',
      },
      {
        q: 'Are the downloaded files watermarked?',
        a: 'No. You get the page’s own markup, changed only by the xmlns namespace repair and the removal of scripts and event handlers.',
      },
      {
        q: 'How is it free? What is the catch?',
        a: 'There is no server, so there is no per-user cost to recover. The extension is MIT-licensed and the source is public, so the claim is checkable rather than something you have to trust.',
      },
      {
        q: 'Where can I get free SVG icons I am definitely licensed to use?',
        a: 'Heroicons, Feather, Lucide, Bootstrap Icons, Material Symbols and Simple Icons all publish complete sets under clear open licences. For a project, start there rather than extracting from a site.',
      },
    ],

    ctaHeading: 'Free, and checkable',
    ctaSub: 'MIT-licensed, no server, no account — and the source is public.',
    related: [
      ['/privacy', 'The privacy position', 'What it can and cannot see'],
      ['/tutorials/svg-downloader-extension', 'Install it', 'Chrome, Edge and Brave'],
      ['/tutorials/svg-extractor-online', 'Vs. online tools', 'Where your file goes'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 12 ──
  {
    slug: 'svg-downloader-extension',
    cardTag: 'Setup',
    cardTitle: 'Install the extension',
    cardBlurb:
      'Chrome, Edge and Brave in under a minute — including pinning it, and a plain-English reading of every permission it asks for.',

    title: 'SVG Downloader Extension — Install It in Under a Minute',
    description:
      'Install and pin the SVG Downloader extension on Chrome, Edge or Brave, and understand exactly what each permission it asks for actually allows.',
    crumb: 'Install the extension',
    eyebrow: 'Tutorial — setup',
    h1: 'The <span class="plot">SVG downloader extension</span>, installed and working',
    lede: 'One install, one pin, and a straight answer about what it can see. That last part is the bit worth reading — an extension that can read pages deserves the scrutiny.',

    videoHeading: 'From install to first download',
    videoTag: 'tutorial · setup',
    videoName: 'The SVG Downloader extension, installed and working in a minute',
    videoDescription:
      'The extension is pinned to the Chrome toolbar, clicked on a page, scans it, and downloads a vector — the same flow that works identically in Edge and Brave.',
    videoCaption: 'Pin it once and the button is where you expect it on every page after that.',
    videoIntro:
      'The pin is the step people skip and then wonder where the button went — Chrome hides new extensions behind the puzzle-piece icon by default.',
    posterAlt: 'The SVG Downloader button pinned in the Chrome toolbar with its popup open.',

    bodyEyebrow: 'Setup',
    bodyHeading: 'Installing on Chrome, Edge or Brave',
    body: `
  <p class="lead-in">All three run Chromium, so it is one extension and one install flow. Anything on Chrome 88 or later works.</p>
  <ul>
    <li><strong>Chrome.</strong> Open the <a href="https://chromewebstore.google.com/detail/svg-web-downloader-extrac/jfgljaebonkbegekbcfbiojgkjlbhpjn">Chrome Web Store listing</a> and choose <em>Add to Chrome</em>, then confirm.</li>
    <li><strong>Edge.</strong> Same listing. Edge will ask you to allow extensions from other stores the first time; agree, then install as normal.</li>
    <li><strong>Brave.</strong> Same listing, no extra step — Brave installs from the Chrome Web Store directly.</li>
  </ul>
  <p>Then pin it, which is the step that actually matters day to day: click the puzzle-piece icon in the toolbar, find SVG Downloader, and click the pin. Without that, Chrome tucks it away and you will click the puzzle piece every single time.</p>`,

    stepsHeading: 'Install and first run',
    stepsIntro: 'About forty seconds, most of which is the store page loading.',
    steps: [
      {
        name: 'Install from the Chrome Web Store',
        text: 'Choose <em>Add to Chrome</em> — or Edge, or Brave — and confirm the permission prompt.',
      },
      {
        name: 'Pin it to the toolbar',
        text: 'Click the puzzle-piece icon, find SVG Downloader, click the pin. The button now sits in your toolbar permanently.',
      },
      {
        name: 'Open a page with vectors on it and click the button',
        text: 'The popup opens and scans that tab. Nothing was watching the page before you clicked.',
      },
      {
        name: 'Download one to confirm it works',
        text: 'Page to any icon, press <em>Download current</em>, and check your downloads folder. That is the install verified.',
      },
    ],

    after: `
  <h2>What each permission actually allows</h2>
  <p>Five permissions, and none of them is the broad one people worry about.</p>
  <ul>
    <li><strong><code>activeTab</code></strong> — it can read the page in the tab you are on, <em>at the moment you click its button</em>, and not before or after. This is the important one: there is <strong>no host permission</strong>, so it is not granted access to "all your data on all websites" and it is not running quietly in the background on every page you visit.</li>
    <li><strong><code>downloads</code></strong> — writes files to your downloads folder. Unavoidable for a downloader.</li>
    <li><strong><code>contextMenus</code></strong> — adds the "Save this as SVG" item to the right-click menu.</li>
    <li><strong><code>scripting</code></strong> — injects the code that reads the page, on demand, when you have already clicked.</li>
    <li><strong><code>storage</code></strong> — keeps your settings (filename prefix, ZIP name) locally on your machine.</li>
  </ul>
  <p>On top of that, the extension's content security policy sets <code>connect-src 'none'</code>, which means its pages are structurally forbidden from opening a network connection. It is not a promise not to phone home; it is a configuration under which phoning home does not work. And since it is <a href="https://github.com/Flozad/svg-downloader">MIT-licensed with public source</a>, none of this has to be taken on faith.</p>

  <h2>Pages where it will not run</h2>
  <p>Browsers block extensions on their own pages, and no extension can override that: <code>chrome://</code> and <code>edge://</code> settings pages, the Chrome Web Store and other add-on galleries, and PDF documents. On those, the popup will tell you it cannot access the page rather than failing silently. For local <code>file://</code> pages you can grant file access explicitly in the extension's details, if you need it.</p>

  <h2>Firefox and Safari</h2>
  <p>Not currently. This is a Manifest V3 Chromium extension; Firefox and Safari each need their own port and their own store review, which has not been done.</p>`,

    facts: [
      [
        'Browsers',
        'Chrome 88+, <strong>Edge</strong> and <strong>Brave</strong>. Not Firefox or Safari.',
      ],
      [
        'Key permission',
        '<code>activeTab</code> — this tab, on your click. <strong>No host permission.</strong>',
      ],
      ['Network', "<code>connect-src 'none'</code> — it structurally cannot phone home."],
      [
        'Source',
        '<a href="https://github.com/Flozad/svg-downloader">MIT-licensed on GitHub</a>. Read it or build it yourself.',
      ],
    ],

    faq: [
      {
        q: 'Which browsers does it work in?',
        a: 'Chrome 88 or later, Edge and Brave — all Chromium-based, one install from the same store listing. There is no Firefox or Safari version.',
      },
      {
        q: 'Where did the button go after I installed it?',
        a: 'Chrome hides new extensions behind the puzzle-piece icon. Click it, find SVG Downloader, and click the pin to keep it in the toolbar.',
      },
      {
        q: 'Can it read every page I visit?',
        a: 'No. It uses activeTab, which grants access to the current tab only at the moment you click its button. There is no host permission, so it is not running in the background on other pages.',
      },
      {
        q: 'Does it send anything to a server?',
        a: 'It cannot. Its content security policy sets connect-src to none, which forbids its pages from opening a network connection at all. The source is public if you want to verify that.',
      },
      {
        q: 'Why does the popup say it cannot access this page?',
        a: 'You are on a page browsers block extensions from — a chrome:// settings page, the Chrome Web Store or another add-on gallery, or a PDF. That restriction is enforced by the browser and cannot be worked around.',
      },
    ],

    ctaHeading: 'Install it, pin it, forget about it',
    ctaSub: 'Under a minute, and it only wakes up when you click it.',
    related: [
      ['/docs/installation', 'Full install docs', 'Every detail'],
      ['/privacy', 'Privacy position', 'What it can see'],
      ['/tutorials/how-to-download-svg-files', 'Your first download', 'The basics'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 13 ──
  {
    slug: 'download-svg-image-from-website',
    cardTag: 'Convert',
    cardTitle: 'Download an SVG image — or convert it',
    cardBlurb:
      'Take the vector if you will edit it, or convert to PNG or JPG at 1×, 2× or 4× on the way out. And when each one is the right call.',

    title: 'Download an SVG Image From a Website (or Convert to PNG)',
    description:
      'Save an SVG image as a vector, or convert it to PNG or JPG at 1×, 2× or 4× while you download. Rendered on your machine — nothing is uploaded to convert it.',
    crumb: 'Download or convert',
    eyebrow: 'Tutorial — vector or raster',
    h1: 'How to <span class="plot">download an SVG image</span> — or convert it',
    lede: 'Half the people looking for this want the vector. The other half actually want a PNG and do not know that is what they want. Both are one click apart.',

    videoHeading: 'Vector out, or raster out',
    videoTag: 'tutorial · convert',
    videoName: 'Download an SVG image, or convert it to PNG on the way out',
    videoDescription:
      'The SVG Downloader popup downloads an icon as a vector, then switches the format segment to PNG, revealing the size selector, and downloads the same icon as a PNG.',
    videoCaption:
      'The same icon, twice: once as <code>.svg</code>, once as <code>.png</code>. Note the filename suffix changing with the format.',
    videoIntro:
      'Watch the suffix on the filename field change from <code>.svg</code> to <code>.png</code>, and the size selector appear beside the segment — the popup only offers a size when a size is meaningful.',
    posterAlt:
      'The SVG Downloader popup with PNG selected in the format segment and a 2× size selector showing.',

    bodyEyebrow: 'Choose deliberately',
    bodyHeading: 'Which one do you actually need?',
    body: `
  <p class="lead-in">This is a decision worth making on purpose, because converting is one-way. A vector can always become a raster later; a raster can never become a vector again.</p>
  <p><strong>Keep the SVG</strong> when the destination is a website or app, a design tool where you will edit the shapes, print of any kind, or anywhere the size is not yet decided. It stays sharp at every size, the file is usually smaller than an equivalent PNG, and you can restyle it with CSS.</p>
  <p><strong>Convert to PNG</strong> when the destination will not accept an SVG — and quite a lot will not. Most email clients, many older CMS uploaders, some chat and social platforms, and plenty of slide templates either reject SVG or render it unreliably. PowerPoint and Keynote are notoriously inconsistent with it. If you are pasting into a document that has to look identical on somebody else's machine, PNG is the safe answer.</p>
  <p><strong>Convert to JPG</strong> rarely, and only for a photographic-style illustration. JPG has no transparency, so an icon comes out on a solid background, and its compression puts visible artefacts around the hard edges that icons are made of. For anything with flat colour and sharp edges, PNG is both smaller and cleaner.</p>`,

    stepsHeading: 'Downloading either way',
    stepsIntro: 'The first two steps are shared; the format segment is where they diverge.',
    steps: [
      {
        name: 'Open the popup and find the image',
        text: 'Click the toolbar button and page to the graphic you want. It works whether the image is an <code>&lt;img&gt;</code> source, inline markup or a CSS background.',
      },
      {
        name: 'For the vector, just download',
        text: 'Leave the format on <em>SVG</em>, type a filename and press <em>Download current</em>. You get the original markup, namespace repaired.',
      },
      {
        name: 'For a raster, switch the format first',
        text: 'Press <em>PNG</em> or <em>JPG</em> in the segment. A size selector appears beside it, and the suffix on the filename field changes to match.',
      },
      {
        name: 'Pick a size, then download',
        text: '1×, 2× or 4× the vector’s intrinsic size. The conversion runs on your machine, on a canvas, and the result downloads like anything else.',
      },
    ],

    after: `
  <h2>What the size multiplier is a multiple of</h2>
  <p>It scales the vector's own intrinsic size — its <code>width</code> and <code>height</code> if it declares them, otherwise the extent of its <code>viewBox</code>. So a 24×24 icon at 4× gives you a 96×96 PNG. If the vector declares no size at all, which is common for sprite symbols, it falls back to a sensible square rather than the 300×150 a bare canvas would default to.</p>
  <p>In practice: <strong>2×</strong> is the right default for anything appearing on a screen, since it covers retina displays. <strong>4×</strong> is for print or for a graphic that will be displayed large. <strong>1×</strong> is for when you need to match an exact pixel size and know what you are doing.</p>

  <h2>Transparency</h2>
  <p>PNG keeps the transparent background; JPG cannot, and will fill it. If you convert an icon to JPG and get an unexpected white or black box behind it, that is not a bug — the format has no way to express transparency. Use PNG.</p>

  <h2>The conversion happens here, not somewhere else</h2>
  <p>Worth stating plainly, because "SVG to PNG converter" is otherwise a category of website that requires you to upload your file. Here the vector is drawn to a canvas inside the popup and read back as an image. It is the same sanitised markup that a download would produce, rendered through a sandboxed image element so nothing in it executes. Nothing is uploaded, and the conversion works with your network disconnected.</p>

  <h2>When conversion fails</h2>
  <p>One case reliably breaks it: an SVG that embeds a cross-origin raster image inside itself. Drawing that to a canvas taints it, and the browser then refuses to let the pixels be read back — a security rule, not a limitation of the extension. You will get a specific message saying so. The vector itself still downloads fine; it is only the raster conversion that cannot proceed.</p>`,

    facts: [
      ['Keep SVG for', 'Web, apps, design tools, print — anywhere the final size is not fixed.'],
      ['Convert for', 'Email, slide decks, older CMS uploaders and anywhere SVG is rejected.'],
      [
        'Sizes',
        '<strong>1×, 2× or 4×</strong> the vector’s intrinsic size. 2× suits most screens.',
      ],
      [
        'Where',
        'On your machine, on a canvas. <strong>Nothing is uploaded to convert it.</strong>',
      ],
    ],

    faq: [
      {
        q: 'Should I download the SVG or convert it to PNG?',
        a: 'Keep the SVG for web, apps, design tools and print, where it stays sharp at any size. Convert to PNG when the destination will not accept SVG — most email clients, many CMS uploaders and most slide software.',
      },
      {
        q: 'What does the 2× size setting mean?',
        a: 'It multiplies the vector’s intrinsic size — its declared width and height, or its viewBox extent. A 24×24 icon at 4× produces a 96×96 PNG. 2× is the sensible default for retina screens.',
      },
      {
        q: 'Why does my JPG have a white box behind the icon?',
        a: 'JPG has no transparency, so the transparent background gets filled. Use PNG for anything with a transparent background — which is nearly every icon.',
      },
      {
        q: 'Is my file uploaded to convert it?',
        a: 'No. The vector is drawn to a canvas inside the popup and read back as an image, entirely on your machine. It works with your network disconnected.',
      },
      {
        q: 'The conversion failed with a cross-origin error.',
        a: 'That SVG embeds a raster image from another domain. Drawing it taints the canvas and the browser refuses to let the pixels be read back — a security rule no extension can bypass. The vector itself still downloads normally.',
      },
      {
        q: 'Can I convert a PNG back into an SVG?',
        a: 'No. The curve data does not exist in a raster. Tracing produces an approximation, not the original shapes.',
      },
    ],

    ctaHeading: 'Vector or raster, one click apart',
    ctaSub: 'Converted on your machine, at the size you actually need.',
    related: [
      ['/tutorials/copy-svg-from-website', 'Copy as an image', 'Straight to the clipboard'],
      ['/tutorials/how-to-download-svg-files', 'The basics', 'Your first download'],
      ['/tutorials/save-svg-from-website', 'When right-click fails', 'The greyed-out menu'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 14 ──
  {
    slug: 'svg-extractor-online',
    cardTag: 'Comparison',
    cardTitle: 'Online extractor vs. extension',
    cardBlurb:
      'Why a paste-a-URL tool comes back half empty — it fetches your address but never renders the page. And where your file goes when you upload it.',

    title: 'Online SVG Extractor vs. Extension — Why One Sees More',
    description:
      'A paste-a-URL extractor fetches HTML but never renders it, so inline and JavaScript-drawn icons stay invisible. Here is the technical reason, and the privacy one.',
    crumb: 'Online vs. extension',
    eyebrow: 'Tutorial — why the online one missed them',
    h1: 'Why an <span class="plot">online SVG extractor</span> can’t see this page',
    lede: 'You pasted the URL, it found four icons, and you can see thirty. Nothing is broken — it simply never ran the page.',

    videoHeading: 'What running the page gets you',
    videoTag: 'tutorial · comparison',
    videoName: 'Why an online SVG extractor cannot see this page',
    videoDescription:
      'A page whose icons are drawn inline. The SVG Downloader popup, running inside the page, scans and finds all 24 and saves them as a ZIP — including icons no server-side fetch would see.',
    videoCaption:
      'Running inside the page is the whole difference. Everything else follows from it.',
    videoIntro:
      'The distinction is not quality or effort — it is architectural. One approach reads a document; the other reads a rendered page.',
    posterAlt:
      'The SVG Downloader popup finding every vector on a page that a server-side fetch would miss.',

    bodyEyebrow: 'The technical reason',
    bodyHeading: 'Fetching a URL and rendering a page are different things',
    body: `
  <p class="lead-in">When you paste a URL into an online extractor, its server sends a plain HTTP request and gets back the HTML the server chose to send. It then searches that text for things that look like SVGs. That is a reasonable approach, and it misses most of a modern site, for four separate reasons.</p>
  <ul>
    <li><strong>No JavaScript runs.</strong> On a React, Vue, Svelte or Angular site, the initial HTML is frequently close to empty — a root element and a script tag. Every icon appears only after the framework executes. A fetch sees the empty shell.</li>
    <li><strong>No CSS is applied.</strong> A vector set as a <code>background-image</code> in a stylesheet only exists once styles are computed against elements. Text-searching HTML will not find it.</li>
    <li><strong>No session.</strong> The server fetching your URL is not logged in as you. Anything behind authentication returns a login page, so a dashboard, an admin panel or a paid tool is simply unreachable.</li>
    <li><strong>Sprites are not resolved.</strong> A <code>&lt;use href="#star"&gt;</code> found in raw HTML is a pointer. Without a rendered document there is nothing to resolve it against, so you get an empty file.</li>
  </ul>
  <p>An extension has none of these problems because it is not fetching anything. It runs inside the page you are already looking at, after the framework has rendered, after the styles have applied, with your session intact and the full document available to resolve references against.</p>`,

    stepsHeading: 'Doing it in the page instead',
    stepsIntro: 'There is no URL to paste, which is the point.',
    steps: [
      {
        name: 'Get the page into the state you want',
        text: 'Log in if it needs a login. Scroll, open the menu, switch to the tab with the icons on it. Whatever you can see, the scan can read.',
      },
      {
        name: 'Click the toolbar button',
        text: 'The scan runs against the live DOM — framework-rendered icons, CSS backgrounds and sprite references included.',
      },
      {
        name: 'Compare the count',
        text: 'This is the moment the difference shows. The number found here is typically several times what a URL fetch reported.',
      },
      {
        name: 'Take them',
        text: 'Individually with <em>Download current</em>, or the whole set with <em>Download all as ZIP</em>. Nothing leaves your machine at any point.',
      },
    ],

    after: `
  <h2>The other question: where does your file go?</h2>
  <p>An online tool has to receive your data to work on it. Depending on the service that can mean the URL of a page you were logged into, or an uploaded file, sitting on somebody else's server — subject to their retention policy, their logging, their jurisdiction and their security. For a public marketing page that may be a fine trade. For an internal dashboard, a client's staging site or an unreleased design, it is a data transfer you probably did not intend to make.</p>
  <p>The on-device version does not involve that trade at all, and not as a policy commitment: the extension's content security policy sets <code>connect-src 'none'</code>, so its pages cannot open a network connection. There is no endpoint to send to. It also means the whole thing works offline.</p>

  <h2>Where an online tool is genuinely the better choice</h2>
  <p>Being fair about it: if the URL points directly at a <code>.svg</code> file and all you want is to convert or optimise it, an online tool is quick and requires installing nothing. If you are on a locked-down machine where you cannot install an extension, it may be your only option. And for optimising SVGs specifically — running SVGO over them, stripping metadata, shrinking paths — the good online optimisers do a job this extension does not attempt at all.</p>

  <h2>The honest limits on this side</h2>
  <p>An extension needs installing, needs a Chromium browser, and cannot do anything on a page you cannot yourself open — <code>chrome://</code> pages, the Web Store, extension galleries. It is also strictly interactive: there is no API and no way to run it over a list of a thousand URLs. For that, a headless browser is the correct tool.</p>`,

    facts: [
      [
        'A URL fetch misses',
        'JavaScript-rendered icons, CSS backgrounds, logged-in pages and sprite targets.',
      ],
      [
        'An extension sees',
        'The <strong>rendered DOM</strong> — after the framework, after the styles, with your session.',
      ],
      ['Privacy', "<code>connect-src 'none'</code>. No endpoint to upload to; works offline."],
      [
        'Online tools win at',
        'Optimising a <code>.svg</code> you already have, and machines where you cannot install anything.',
      ],
    ],

    faq: [
      {
        q: 'Why did the online extractor only find a few icons?',
        a: 'It fetched the HTML but never rendered the page. On a JavaScript-rendered site most icons do not exist in the initial HTML at all, CSS background vectors require computed styles, and sprite references cannot be resolved without a live document.',
      },
      {
        q: 'Can an online tool extract from a page I have to log in to see?',
        a: 'No. Its server is not logged in as you, so it receives a login page. An extension runs in your browser with your session, so it works normally.',
      },
      {
        q: 'Is it safe to paste a URL into an online extractor?',
        a: 'For a public marketing page, generally yes. For an internal dashboard, a staging site or an unreleased design, you are handing a third party a URL and its contents — worth thinking about before you do it.',
      },
      {
        q: 'Does the extension upload anything?',
        a: 'It cannot. Its content security policy sets connect-src to none, so its pages are forbidden from opening a network connection. It works with your network disconnected.',
      },
      {
        q: 'When is an online tool actually better?',
        a: 'When the URL points straight at a .svg file and you want to optimise or convert it, or when you are on a machine where you cannot install extensions. Online SVG optimisers in particular do a job this extension does not attempt.',
      },
    ],

    ctaHeading: 'Read the page, not a copy of its HTML',
    ctaSub: 'Framework-rendered icons, logged-in pages, and nothing uploaded.',
    related: [
      ['/tutorials/download-svg-from-url', 'From a URL', 'The address case'],
      ['/privacy', 'Privacy position', 'What it can see'],
      ['/tutorials/extract-svg-from-website', 'Extract everything', 'One ZIP'],
    ],
  },

  // ───────────────────────────────────────────────────────────── 15 ──
  {
    slug: 'website-svg-downloader',
    cardTag: 'Decide',
    cardTitle: 'Which method should you use?',
    cardBlurb:
      'One scan, four ways out — file, ZIP, clipboard or right-click. A short decision guide for picking the right one first time.',

    title: 'Website SVG Downloader — Which Method Should You Use?',
    description:
      'One scan, four exits: a single file, the whole page as a ZIP, the markup on your clipboard, or a one-step right-click. A guide to picking the right one.',
    crumb: 'Which method?',
    eyebrow: 'Tutorial — pick your exit',
    h1: 'The <span class="plot">website SVG downloader</span>, and which route to take',
    lede: 'Every method here ends with the same sanitised vector. They differ only in where it lands and how much you have to decide on the way — so pick by destination.',

    videoHeading: 'Three exits from one scan',
    videoTag: 'tutorial · overview',
    videoName: 'One icon, a whole set, or the markup — pick your exit',
    videoDescription:
      'A single scan of a page, followed by three different exits: Download current saves one file, Download all as ZIP saves the set, and Copy code puts the markup on the clipboard.',
    videoCaption:
      'One scan at the start. Everything after it is a choice about where the vector goes.',
    videoIntro:
      'The scan only happens once in this recording. All three exits run off the same list — which is why switching between them costs nothing.',
    posterAlt:
      'The SVG Downloader popup showing its download, ZIP and copy actions after a single scan.',

    bodyEyebrow: 'Decide by destination',
    bodyHeading: 'Four routes, and when each is right',
    body: `
  <p class="lead-in">The question is not which method is best — it is what you are going to do with the vector once you have it.</p>
  <ul>
    <li><strong>Download current</strong> — you want one specific vector as a file, and you care what it is called. The default route. <a href="/tutorials/how-to-download-svg-files">How →</a></li>
    <li><strong>Download all as ZIP</strong> — you want the set, or you do not yet know which one you need and would rather sort it out on disk. De-duplicated and numbered. <a href="/tutorials/extract-svg-from-website">How →</a></li>
    <li><strong>Copy code / Copy image</strong> — the destination is an editor or a document, and a file on disk would just be a step you delete afterwards. <a href="/tutorials/copy-svg-from-website">How →</a></li>
    <li><strong>Right-click → Save this as SVG</strong> — you are looking straight at the one you want and do not need a preview, a name or a choice. The fastest route. <a href="/tutorials/grab-svg-from-website">How →</a></li>
  </ul>
  <p>And one decision that cuts across all four: if the destination will not accept an SVG — email, most slide software, older CMS uploaders — switch the format segment to PNG before you download. <a href="/tutorials/download-svg-image-from-website">How →</a></p>`,

    stepsHeading: 'The shared part',
    stepsIntro:
      'Three of the four routes begin identically. Only the last step differs, and it is the only one you have to think about.',
    steps: [
      {
        name: 'Get the page into the state you want to capture',
        text: 'Log in, scroll, open the menu — whatever puts the vectors you want on screen. The scan reads the DOM as it stands.',
      },
      {
        name: 'Open the popup and scan',
        text: 'One click. The counter reports what the page renders, de-duplicated.',
      },
      {
        name: 'Preview and pick',
        text: '<em>Prev</em> and <em>Next</em> walk the set, isolated and off the busy page.',
      },
      {
        name: 'Choose your exit',
        text: '<em>Download current</em> for one file, <em>Download all as ZIP</em> for the set, or <em>Copy code</em> / <em>Copy image</em> for the clipboard. Switch the format segment first if you need a PNG or JPG.',
      },
    ],

    after: `
  <h2>What every route has in common</h2>
  <p>Whichever exit you take, the same two things happen to the markup on the way out, and they are the reason the result is usable. The <code>xmlns</code> namespace is added if it was missing, which is what makes a file lifted out of a page open as a standalone document. And anything executable — <code>&lt;script&gt;</code> elements, <code>on*</code> event handlers, external references — is stripped, so you are not carrying somebody else's page behaviour into your codebase or your design tool.</p>

  <h2>The five-second version</h2>
  <ul>
    <li>Need <strong>one icon, right now</strong>? Right-click it.</li>
    <li>Need <strong>one icon, named properly</strong>? Popup, then <em>Download current</em>.</li>
    <li>Need <strong>the whole set</strong>? Popup, then <em>Download all as ZIP</em>.</li>
    <li>Pasting into <strong>code</strong>? <em>Copy code</em>.</li>
    <li>Pasting into a <strong>doc or chat</strong>? <em>Copy image</em>.</li>
    <li>Destination <strong>rejects SVG</strong>? Switch to PNG first.</li>
  </ul>`,

    facts: [
      ['One file', '<em>Download current</em> — with a filename you choose.'],
      ['The set', '<em>Download all as ZIP</em> — de-duplicated and numbered.'],
      ['No file', '<em>Copy code</em> for editors, <em>Copy image</em> for documents.'],
      ['Fastest', 'Right-click → <em>Save this as SVG</em>. No popup at all.'],
    ],

    faq: [
      {
        q: 'Which method gives the best quality?',
        a: 'They are identical. Every route runs the same sanitiser and the same namespace repair — they differ only in where the result lands and how much you choose on the way.',
      },
      {
        q: 'Can I download just a few of the SVGs rather than all of them?',
        a: 'Yes. Page to each one and use Download current, naming each as you go. Download all as ZIP is for when you want the whole set.',
      },
      {
        q: 'What is stripped from the markup?',
        a: 'Script elements, on* event handler attributes and external references. The shapes are untouched, and the xmlns namespace is added so the file opens standalone.',
      },
      {
        q: 'Do I have to rescan between downloads?',
        a: 'No. One scan builds the list and every exit runs off it. Rescan only if you change the page — open a modal, switch a tab, scroll a lazy grid into view.',
      },
      {
        q: 'What if the site will not accept the SVG I downloaded?',
        a: 'Switch the format segment to PNG and download again. Email clients, slide software and older CMS uploaders frequently reject SVG.',
      },
    ],

    ctaHeading: 'One scan, whichever exit you need',
    ctaSub: 'A file, a ZIP, the clipboard, or a single right-click.',
    related: [
      ['/tutorials/how-to-download-svg-files', 'Start with the basics', 'Your first file'],
      ['/tutorials/extract-svg-from-website', 'The whole set', 'One ZIP'],
      ['/tutorials/grab-svg-from-website', 'The fastest route', 'One right-click'],
    ],
  },
];
