import { loadAgreements } from "@/lib/agreements";
import _ from "lodash";
import path from "path";
import fs from "fs";

if (process.argv.length < 3) {
  console.log("Usage: pnpm sitemap <year> <src> <dst>");
  process.exit(1);
}

(async function () {
  let [year, src, dst] = process.argv.slice(2);
  src = path.resolve(src);
  dst = path.resolve(dst);
  const agreements = await loadAgreements(src);
  const outputFile = path.join(dst, "sitemap.xml");

  const lines = [
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  agreements.forEach((agreement) => {
    const lastmod = _.max(agreement.documents.map((doc) => doc.created));
    lines.push(`<url>`);
    lines.push(
      `<loc>https://kollektivavtal.github.io/${year}/${agreement.slug}</loc>`
    );
    lines.push(`<lastmod>${lastmod?.toISOString()}</lastmod>`);
    lines.push(`</url>`);
  });

  lines.push("</urlset>");
  const xml = lines.join("\n");
  fs.writeFileSync(outputFile, xml);
})();
