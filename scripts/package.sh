#!/usr/bin/env bash
# Build a Chrome Web Store zip of extension/ into dist/, named by the
# manifest version. Fails if the manifest is unreadable.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(bun -e "console.log(JSON.parse(require('fs').readFileSync('extension/manifest.json','utf8')).version)")
OUT="dist/svg-downloader-extractor-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"
(cd extension && zip -r "../$OUT" . -x "*.DS_Store" -x "__MACOSX/*")
echo "Created $OUT"
unzip -l "$OUT"
