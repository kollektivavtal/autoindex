import { slugify } from "@/lib/agreements";
import fs from "fs";
import path from "path";

if (process.argv.length < 3) {
  console.log("Usage: pnpm copy <src> <dst>");
  process.exit(1);
}

(async function () {
  const [src, dst] = process.argv.slice(2).map((p) => path.resolve(p));

  const pdfs = fs
    .readdirSync(src)
    .filter((p) => p.endsWith(".pdf"))
    .map((p) => path.join(src, p));

  for (const pdf of pdfs) {
    const basename = slugify(path.basename(pdf, ".pdf"));
    const dstPath = path.join(dst, `${basename}.pdf`);
    fs.copyFileSync(pdf, dstPath);
    console.log(`Copied ${basename} to ${dst}`);
  }
})();
