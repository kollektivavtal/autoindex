#!/bin/bash

set -e

README_FILE="README.md"

echo "# Kollektivavtal ${YEAR}" > "$README_FILE"
echo "" >> "$README_FILE"

while IFS= read -r -d '' pdf; do
  pdf_name=$(basename "$pdf")
  agreement_name="${pdf_name%.pdf}"
  encoded_pdf_name=$(echo "$pdf_name" | sed 's/ /%20/g')
  link="* [${agreement_name}](http://kollektivavtal.github.io/${YEAR}/${encoded_pdf_name})"
  echo "$link" >> "$README_FILE"
done < <(find . -name "*.pdf" -print0)
