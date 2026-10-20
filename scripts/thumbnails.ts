import sharp from "sharp";
import { fromPath } from "pdf2pic";
import fs from "fs";
import path from "path";
import { parseFilename, slugify } from "@/lib/agreements";

const sizes = [320];

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

  // Track the lowest-rank (primary) document per agreement so we can also
  // emit an agreement-level thumbnail whose name is inferable from the
  // agreement's slug alone.
  const agreementPrimary = new Map<string, { pdf: string; rank: number }>();

  for (const pdf of pdfs) {
    const basename = slugify(path.basename(pdf, ".pdf"));
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

    const { agreementName, documentRank } = parseFilename(
      path.basename(pdf),
    );
    const agreementSlug = slugify(agreementName);
    const current = agreementPrimary.get(agreementSlug);
    if (!current || documentRank < current.rank) {
      agreementPrimary.set(agreementSlug, { pdf, rank: documentRank });
    }
  }

  // Generate the agreement thumbnail from each agreement's primary document.
  for (const [agreementSlug, { pdf }] of agreementPrimary) {
    const convert = fromPath(pdf, {
      density: 100,
      saveFilename: agreementSlug,
      preserveAspectRatio: true,
      savePath: dst,
      format: "webp",
    });
    const output = await convert(1);
    for (const size of sizes) {
      const thumbnailPath = `${dst}/${agreementSlug}-${size}.webp`;
      await sharp(output.path)
        .resize(size)
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    fs.rmSync(output.path!);
  }
})();
