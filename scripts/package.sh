#!/usr/bin/env bash
# Build a Chrome Web Store zip of extension/ into dist/, named by the
# manifest version. Fails if the manifest is unreadable.
set -euo pipefail
cd "$(dirname "$0")/.."

read_version() {
  bun -e "console.log(JSON.parse(require('fs').readFileSync('$1','utf8')).version)"
}

VERSION=$(read_version extension/manifest.json)
PKG_VERSION=$(read_version package.json)

# The manifest is the source of truth, but package.json drifting out of sync is
# a reliable way to ship a zip labelled with the wrong version. Compare them
# normalized to x.y.z, since Chrome accepts a two-part "1.3" and npm does not.
normalize() { echo "$1" | awk -F. '{printf "%d.%d.%d", $1, $2, $3}'; }
if [ "$(normalize "$VERSION")" != "$(normalize "$PKG_VERSION")" ]; then
  echo "Version mismatch: extension/manifest.json is $VERSION, package.json is $PKG_VERSION" >&2
  exit 1
fi

OUT="dist/svg-downloader-extractor-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"
(cd extension && zip -r "../$OUT" . -x "*.DS_Store" -x "__MACOSX/*")
echo "Created $OUT"
unzip -l "$OUT"
