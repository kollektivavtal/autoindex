#!/bin/bash

set -e

BASE_URL="$1"
README_FILE="README.md"

if [ ! -f "$README_FILE" ]; then
  echo "# PDF Links" > "$README_FILE"
fi

if ! grep -q "^# Kollektivavtal" "$README_FILE"; then
  echo -e "# Kollektivavtal\n$(cat $README_FILE)" > "$README_FILE"
fi

for pdf in $(find . -name "*.pdf"); do
  pdf_name=$(basename "$pdf")
  link="* ${BASE_URL}${pdf_name}"
  if ! grep -q "$link" "$README_FILE"; then
    echo "$link" >> "$README_FILE"
  fi
done
