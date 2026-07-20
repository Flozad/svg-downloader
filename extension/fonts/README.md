# Bundled fonts

These are third-party fonts, licensed separately from the MIT license covering the rest of this repository. They are bundled rather than loaded from a CDN because the extension's CSP (`script-src 'self'`) forbids remote resources, and because an extension that phones home to a font host on every popup open would undercut the privacy claim.

| File | Family | Copyright | License |
| --- | --- | --- | --- |
| `bricolage-var.woff2` | [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) | 2022 The Bricolage Grotesque Project Authors | [OFL 1.1](OFL-Bricolage-Grotesque.txt) |
| `space-mono-400.woff2`, `space-mono-700.woff2` | [Space Mono](https://github.com/googlefonts/spacemono) | 2016 The Space Mono Project Authors | [OFL 1.1](OFL-Space-Mono.txt) |

The same files are duplicated in `docs/fonts/` for the marketing site. That duplication is deliberate: the extension must ship self-contained, and the site is deployed independently.
