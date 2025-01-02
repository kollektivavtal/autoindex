#!/bin/bash

set -e

index_html="index.html"

echo "<!doctype html>" >> "$index_html"
echo '<html lang="en" >' >> "$index_html"
echo ' <head>' >> "$index_html"
echo '  <meta charset="utf-8">' >> "$index_html"
echo '  <title>Kollektivavtal</title>' >> "$index_html"
echo ' </head>' >> "$index_html"
echo ' <body>' >> "$index_html"
echo '  <h1>Kollektivavtal</h1>' >> "$index_html"
echo '  <ul>' >> "$index_html"

while IFS= read -r -d '' pdf; do
  pdf_name=$(basename "$pdf")
  agreement_name="${pdf_name%.pdf}"
  encoded_pdf_name=$(echo "$pdf_name" | sed 's/ /%20/g')
  echo '   <li>' >> "$index_html"
  echo "    <a href=\"http://kollektivavtal.github.io/${YEAR}/${encoded_pdf_name}\">" >> "$index_html"
  echo "     ${agreement_name}" >> "$index_html"
  echo '    </a>' >> "$index_html"
  echo '   </li>' >> "$index_html"
  echo 
done < <(find . -name "*.pdf" -print0 | sort)

echo '  </ul>' >> "$index_html"
echo ' </body>' >> "$index_html"
echo '</html>' >> "$index_html"
