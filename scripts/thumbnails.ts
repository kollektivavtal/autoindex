import sharp from "sharp";
import { fromPath } from "pdf2pic";
import fs from "fs";
import path from "path";

const sizes = [64];

if (process.argv.length < 3) {
  console.log("Usage: pnpm thumbnails <src> <dst>");
  process.exit(1);
}

(async function () {
  const [src, dst] = process.argv.slice(2).map((p) => path.resolve(p));

  const pdfs = fs
    .readdirSync(src)
    .filter((p) => p.endsWith(".pdf"))
    .map((p) => path.join(src, p));

  for (const pdf of pdfs) {
    const basename = path.basename(pdf, ".pdf");
    const convert = fromPath(pdf, {
      density: 100,
      saveFilename: basename,
      preserveAspectRatio: true,
      savePath: dst,
      format: "webp",
    });
    const output = await convert(1);
    for (const size of sizes) {
      const thumbnailPath = `${dst}/${basename}-${size}.webp`;
      await sharp(output.path)
        .resize(size)
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    fs.rmSync(output.path!);
  }
})();
