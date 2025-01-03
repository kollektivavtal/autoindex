import { promises as fs } from "fs";
import path, { parse } from "path";
import sharp from "sharp";
import { fromPath } from "pdf2pic";

type Agreement = {
  name: string;
  slug: string;
  documents: Document[];
};

type Document = {
  name: string;
  filename: string;
  bytes: number;
  rank: number;
  thumbnails: Record<string, string>;
};

type ParseResult = {
  agreementName: string;
  documentName: string;
  documentRank: number;
};

export function parseFilename(filename: string): ParseResult {
  const basename = path.basename(filename, ".pdf");

  let agreementName = basename;
  let documentName = basename;
  let documentRank = 0;

  const emDashMatches = basename.match(/^([^–]+) – (.+)$/);
  if (emDashMatches) {
    agreementName = emDashMatches[1];
    documentName = emDashMatches[2];
  }

  const rankMatches = basename.match(/^([^\[]+) \((\d+)\) (.+)$/);
  if (rankMatches) {
    agreementName = rankMatches[1];
    documentRank = parseInt(rankMatches[2], 10);
    documentName = rankMatches[3];
  }

  return {
    agreementName,
    documentName,
    documentRank,
  };
}

export default async function (eleventyConfig) {
  const { EleventyHtmlBasePlugin } = await import("@11ty/eleventy");

  const pathPrefix = `/${process.env.YEAR}/`;
  let outputDir = "_site";

  if (process.env.ELEVENTY_ENV !== "production") {
    outputDir = `_site/${process.env.YEAR}`;
  }

  async function generateThumbnails(pdfPath) {
    const basename = path.basename(pdfPath, ".pdf");
    const convert = fromPath(pdfPath, {
      density: 100,
      saveFilename: basename,
      preserveAspectRatio: true,
      savePath: outputDir,
      format: "webp",
    });
    const output = await convert(1);
    const thumbnailPaths: [string, string][] = [];
    for (const size of [32, 64]) {
      const thumbnailPath = `${outputDir}/${basename}-${size}.webp`;
      await sharp(output.path)
        .resize(size)
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
      thumbnailPaths.push([
        `w${size}`,
        path.relative(outputDir, thumbnailPath),
      ]);
    }
    return Object.fromEntries(thumbnailPaths);
  }

  eleventyConfig.addPassthroughCopy("*.pdf");

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    // baseHref: eleventyConfig.pathPrefix,
  });

  eleventyConfig.addCollection("agreements", async function () {
    const files = await fs.readdir(".", { withFileTypes: true });

    const pdfs = files
      .filter(
        (file) =>
          file.isFile() && path.extname(file.name).toLowerCase() === ".pdf",
      )
      .map((file) => {
        const filename = file.name;
        const basename = path.basename(filename, ".pdf");
        return {
          basename,
          filename,
        };
      });

    const agreements = new Map<string, Agreement>();

    await Promise.all(
      pdfs.map(async (item) => {
        const parseResult = parseFilename(item.filename);
        let agreement = agreements.get(parseResult.agreementName);
        if (!agreement) {
          const name = parseResult.agreementName;
          const slug = name.toLowerCase().replace(/ /g, "-");
          agreement = {
            name,
            slug,
            documents: [],
          };
          agreements.set(parseResult.agreementName, agreement);
        }

        const filename = item.filename;

        const pdfPath = path.resolve(filename);
        const thumbnails = await generateThumbnails(pdfPath);
        const bytes = (await fs.stat(pdfPath)).size;

        agreement.documents.push({
          name: parseResult.documentName,
          filename,
          bytes,
          thumbnails,
          rank: parseResult.documentRank,
        });

        agreement.documents.sort((a, b) => a.rank - b.rank);
      }),
    );

    return [...agreements.values()];
  });

  return {
    pathPrefix,
    dir: {
      output: outputDir,
    },
  };
}
