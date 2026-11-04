#!/usr/bin/env bash
set -euo pipefail

src=${1:?Usage: publish-assets.sh <source-directory> <destination-directory>}
dst=${2:?Usage: publish-assets.sh <source-directory> <destination-directory>}
mkdir -p "$dst"

find "$src" -maxdepth 1 -type f -iname '*.pdf' -print0 |
  while IFS= read -r -d '' pdf; do
    filename=$(basename "$pdf")
    cp "$pdf" "$dst/$filename"
  done

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

find "$dst" -maxdepth 1 -type f -iname '*.pdf' -print0 |
  while IFS= read -r -d '' pdf; do
    filename=$(basename "$pdf")
    basename_without_extension=${filename%.pdf}
    page="$workdir/page.png"

    gs -q -dSAFER -dBATCH -dNOPAUSE \
      -sDEVICE=pngalpha -r100 -dFirstPage=1 -dLastPage=1 \
      -sOutputFile="$page" "$pdf"
    cwebp -quiet -resize 320 0 -q 80 "$page" \
      -o "$dst/${basename_without_extension}-320.webp"
  done
