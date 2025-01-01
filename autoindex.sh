#!/bin/bash

set -e

README_FILE="README.md"

echo "# Kollektivavtal ${YEAR}" > "$README_FILE"
echo "" >> "$README_FILE"

while IFS= read -r -d '' pdf; do
  pdf_name=$(basename "$pdf")
  link="* [http://kollektivavtal.github.io/${YEAR}/${pdf_name}](${pdf_name})"
  echo "$link" >> "$README_FILE"
done < <(find . -name "*.pdf" -print0)
