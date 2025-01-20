import { unified } from "unified";
import remarkParse from "remark-parse";
import { select, selectAll } from "unist-util-select";
import EleventyUnifiedPlugin from "eleventy-plugin-unified";
import { promises as fs } from "fs";
import path, { parse } from "path";
import sharp from "sharp";
import { fromPath } from "pdf2pic";

type Language = "sv" | "en";

type Agreement = {
  name: string;
  slug: string;
  documents: Document[];
  sources: string[];
};

type Document = {
  name: string;
  filename: string;
  bytes: number;
  rank: number;
  thumbnails: Record<string, string>;
  language: Language;
};

type ParseResult = {
  agreementName: string;
  documentName: string;
  documentRank: number;
  documentLanguage?: Language;
};

export function parseFilename(filename: string): ParseResult {
  let basename = path.basename(filename, ".pdf");

  let agreementName = basename;
  let documentName = basename;
  let documentRank = 0;
  let documentLanguage: Language | undefined;

  const languageMatches = basename.match(/ \((en|sv)\)$/);
  if (languageMatches) {
    documentLanguage = languageMatches[1] as Language;
    basename = basename.substring(0, languageMatches.index);
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
    documentLanguage,
  };
}

function slugify(name: string): string {
  return name
    .normalize("NFC")
    .toLowerCase()
    .replace(/ /gi, "-")
    .replace(/[()]/gi, "-")
    .replace(/å/gi, "a")
    .replace(/ä/gi, "a")
    .replace(/ö/gi, "o")
    .replace(/--+/g, "-");
}

export default async function (eleventyConfig) {
  const githubActionPath = process.env.GITHUB_ACTION_PATH || ".";
  const githubWorkspace = process.env.GITHUB_WORKSPACE || ".";

  const readme = await fs.readFile(`${githubWorkspace}/readme.md`, "utf-8");
  const processor = unified().use(remarkParse);
  const tree = processor.parse(readme);

  const referenceMap: Record<string, string[]> = {};

  let prevH2: string | null = null;
  for (const child of tree.children) {
    if (child.type === "heading" && child.depth === 2) {
      prevH2 = (child.children[0] as any).value;
      referenceMap[slugify(prevH2)] = [];
    } else if (child.type === "list" && prevH2) {
      referenceMap[slugify(prevH2)] = selectAll("text", child).map(
        (node) => (node as any).value,
      );
      prevH2 = null;
    } else {
      prevH2 = null;
    }
  }

  const { EleventyHtmlBasePlugin } = await import("@11ty/eleventy");

  const pathPrefix = `/${process.env.YEAR}/`;
  let outputDir = `${githubActionPath}/_site`;

  if (process.env.ELEVENTY_ENV !== "production") {
    outputDir = `${githubActionPath}/_site/${process.env.YEAR}`;
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
    const files = await fs.readdir(githubWorkspace, { withFileTypes: true });

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
          const slug = slugify(name);
          agreement = {
            name,
            slug,
            documents: [],
            sources: referenceMap[slug] || [],
          };
          agreements.set(parseResult.agreementName, agreement);
        }

        const filename = item.filename;
        const pdfPath = path.join(githubWorkspace, filename);
        const thumbnails = await generateThumbnails(pdfPath);
        const bytes = (await fs.stat(pdfPath)).size;

        agreement.documents.push({
          name: parseResult.documentName,
          filename,
          bytes,
          thumbnails,
          rank: parseResult.documentRank,
          language: parseResult.documentLanguage || "sv",
        });

        agreement.documents.sort((a, b) => a.rank - b.rank);
      }),
    );

    return [...agreements.values()];
  });

  eleventyConfig.addPlugin(EleventyUnifiedPlugin, {
    htmlTransforms: [["rehype-format", { indent: " " }]],
  });

  return {
    pathPrefix,
    dir: {
      output: outputDir,
    },
    site: {
      url: "https://kollektivavtal.github.io/",
    },
  };
}
