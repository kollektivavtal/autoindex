import { promises as fs } from "fs";
// import { execSync } from "child_process";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { selectAll } from "unist-util-select";

import path from "path";

type Language = "sv" | "en";

export type Agreement = {
  name: string;
  slug: string;
  documents: Document[];
  sources: string[];
};

export type Document = {
  name: string;
  filename: string;
  bytes: number;
  rank: number;
  thumbnails: Record<string, string>;
  language: Language;
  created: Date;
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

export function slugify(name: string): string {
  return name
    .normalize("NFC")
    .toLowerCase()
    .replace(/ /gi, "-")
    .replace(/&/gi, "-")
    .replace(/[()]/gi, "-")
    .replace(/å/gi, "a")
    .replace(/ä/gi, "a")
    .replace(/ö/gi, "o")
    .replace(/--+/g, "-");
}

export async function loadAgreements(src: string): Promise<Agreement[]> {
  const pdfs = (await fs.readdir(src))
    .filter((p) => p.endsWith(".pdf"))
    .map((p) => path.join(src, p));

  const readme = await fs.readFile(`${src}/readme.md`, "utf-8");
  const processor = unified().use(remarkParse);
  const tree = processor.parse(readme);

  const referenceMap: Record<string, string[]> = {};

  let prevH2: string | null = null;
  for (const child of tree.children) {
    if (child.type === "heading" && child.depth === 2) {
      prevH2 = (child.children[0] as { value: string }).value;
      referenceMap[slugify(prevH2!)] = [];
    } else if (child.type === "list" && prevH2) {
      referenceMap[slugify(prevH2)] = selectAll("text", child).map(
        (node) => (node as unknown as { value: string }).value,
      );
      prevH2 = null;
    } else {
      prevH2 = null;
    }
  }

  const agreementMap = new Map<string, Agreement>();

  await Promise.all(
    pdfs.map(async (pdf) => {
      const basename = path.basename(pdf);
      const parseResult = parseFilename(basename);

      let agreement = agreementMap.get(parseResult.agreementName);
      if (!agreement) {
        const name = parseResult.agreementName;
        const slug = slugify(name);
        agreement = {
          name,
          slug,
          documents: [],
          sources: referenceMap[slug] || [],
        };
        agreementMap.set(parseResult.agreementName, agreement);
      }

      const filename = basename;
      const minusExt = filename.slice(0, -4);
      const thumbnails = Object.fromEntries(
        [64].map((size) => [`w${size}`, `${slugify(minusExt)}-${size}.webp`]),
      );
      const bytes = (await fs.stat(pdf)).size;

      // const gitDir = path.join(src, ".git");
      // const workTree = src;
      // const command = `git --git-dir="${gitDir}" --work-tree="${workTree}" log --follow --diff-filter=A --format=%aI -- "${filename}"`;
      // const buffer = execSync(command);
      // const stdout = buffer.toString();
      // const creationDate = stdout.trim();
      // const created = new Date(creationDate);

      agreement.documents.push({
        name: parseResult.documentName,
        filename: `${slugify(basename.slice(0, -4))}.pdf`,
        bytes,
        thumbnails,
        rank: parseResult.documentRank,
        language: parseResult.documentLanguage || "sv",
        created: new Date(),
      });

      agreement.documents.sort((a, b) => a.rank - b.rank);
    }),
  );

  const agreements = Array.from(agreementMap.values());
  return agreements;
}
