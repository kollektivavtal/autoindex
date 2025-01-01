#!/bin/bash

set -e

BASE_URL="$1"
README_FILE="README.md"

if [ ! -f "$README_FILE" ]; then
  echo "# Kollektivavtal" > "$README_FILE"
  echo "" >> "$README_FILE"
fi

while IFS= read -r -d '' pdf; do
  pdf_name=$(basename "$pdf")
  link="* ${BASE_URL}${pdf_name}"
  if ! grep -qF "$link" "$README_FILE"; then
    echo "$link" >> "$README_FILE"
  fi
done < <(find . -name "*.pdf" -print0)
