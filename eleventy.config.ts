import { promises as fs } from "fs";
import path from "path";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
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
  thumbnails: Record<string, string>;
};

export default async function (eleventyConfig) {
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
        const parts = basename.split(" – ");
        const group = parts[0];
        return {
          basename,
          filename,
          group,
        };
      });

    const agreements = new Map<string, Agreement>();

    await Promise.all(
      pdfs.map(async (item) => {
        let agreement = agreements.get(item.group);
        if (!agreement) {
          const name = item.group;
          const slug = name.toLowerCase().replace(/ /g, "-");
          agreement = {
            name,
            slug,
            documents: [],
          };
          agreements.set(item.group, agreement);
        }

        const filename = item.filename;
        let name = item.basename;
        if (name.includes(" – ")) {
          const parts = name.split(" – ");
          name = parts[1];
        }

        const pdfPath = path.resolve(filename);
        const thumbnails = await generateThumbnails(pdfPath);
        const bytes = (await fs.stat(pdfPath)).size;

        agreement.documents.push({
          name,
          filename,
          bytes,
          thumbnails,
        });
        console.log(agreement.documents);
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
