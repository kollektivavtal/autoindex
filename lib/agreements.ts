import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { selectAll } from "unist-util-select";
import path from "path";

const execAsync = promisify(exec);

type Language = "sv" | "en";

export type Agreement = {
  name: string;
  slug: string;
  thumbnails: Record<string, string>;
  documents: Document[];
  forbund: Forbund[];
  sources: string[];
  redirectTo?: string;
};

export type Forbund = {
  name: string;
  url: string;
  logo: string;
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

type Redirect = {
  name: string;
  slug: string;
  redirectTo: string;
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
    .replace(/é/gi, "e")
    .replace(/--+/g, "-")
    .replace(/-$/g, "");
}

// Agreement thumbnail URLs are inferable from the agreement slug alone,
// e.g. slug "unionen-tjanstemannaavtal" -> "unionen-tjanstemannaavtal-320.webp".
export function agreementThumbnails(slug: string): Record<string, string> {
  return Object.fromEntries(
    [320].map((size) => [`w${size}`, `${slug}-${size}.webp`]),
  );
}

function headingText(node: unknown): string {
  return selectAll("text", node as Parameters<typeof selectAll>[1])
    .map((n) => (n as unknown as { value: string }).value)
    .join("");
}

// Infer a union's logo URL from its fackforbund.github.io page URL, e.g.
// https://fackforbund.github.io/unionen/ -> .../unionen/unionen@512x512.webp
export function inferForbundLogo(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  const slug = trimmed.split("/").pop() || "";
  return `${trimmed}/${slug}@512x512.webp`;
}

// Temporarily point fackforbund links at the local dev server.
function rewriteForbundUrl(url: string): string {
  return url.replace(
    /^https?:\/\/fackforbund\.github\.io/,
    "http://localhost:3000",
  );
}

type ReferenceMaps = {
  forbund: Record<string, Forbund[]>;
  sources: Record<string, string[]>;
};

// Parse a kollektivavtal readme into per-agreement "Förbund" and "Källor"
// lists. Supports the nested format:
//
//   ## {Name}
//   ### Förbund
//   - [Unionen](https://fackforbund.github.io/unionen/)
//   ### Källor
//   - {source url}
//
// and remains backward compatible with the legacy flat format where a list
// directly under the "## {Name}" heading is treated as sources.
function parseReferenceMaps(readme: string): ReferenceMaps {
  const tree = unified().use(remarkParse).parse(readme);
  const forbund: Record<string, Forbund[]> = {};
  const sources: Record<string, string[]> = {};

  let currentSlug: string | null = null;
  let currentSection: "forbund" | "kallor" | null = null;

  for (const child of tree.children) {
    if (child.type === "heading" && child.depth === 2) {
      currentSlug = slugify(headingText(child));
      currentSection = null; // legacy lists default to sources
      forbund[currentSlug] = forbund[currentSlug] || [];
      sources[currentSlug] = sources[currentSlug] || [];
    } else if (child.type === "heading" && child.depth === 3 && currentSlug) {
      const text = headingText(child).toLowerCase();
      currentSection = text.startsWith("förbund")
        ? "forbund"
        : text.startsWith("källor")
          ? "kallor"
          : null;
    } else if (child.type === "list" && currentSlug) {
      if (currentSection === "forbund") {
        forbund[currentSlug] = selectAll("link", child).map((link) => {
          const url = rewriteForbundUrl(
            (link as unknown as { url: string }).url,
          );
          return { name: headingText(link), url, logo: inferForbundLogo(url) };
        });
      } else {
        sources[currentSlug] = selectAll("text", child).map(
          (node) => (node as unknown as { value: string }).value,
        );
      }
    }
  }

  return { forbund, sources };
}

function parseRedirects(readme: string): Redirect[] {
  const tree = unified().use(remarkParse).parse(readme);
  const redirects: Redirect[] = [];

  for (let index = 0; index < tree.children.length - 1; index += 1) {
    const heading = tree.children[index];
    const paragraph = tree.children[index + 1];

    if (
      heading.type !== "heading" ||
      heading.depth !== 2 ||
      paragraph.type !== "paragraph"
    ) {
      continue;
    }

    const headingText = selectAll("text", heading)
      .map((node) => (node as unknown as { value: string }).value)
      .join("");
    const hasNumera = selectAll("text", paragraph).some((node) =>
      (node as unknown as { value: string }).value.includes("Numera"),
    );
    const link = paragraph.children.find(
      (node) =>
        node.type === "link" &&
        typeof node.url === "string" &&
        node.url.startsWith("#"),
    );

    if (headingText && hasNumera && link?.type === "link") {
      redirects.push({
        name: headingText,
        slug: slugify(headingText),
        redirectTo: slugify(link.url.slice(1)),
      });
    }
  }

  return redirects;
}

let agreementsCache: Agreement[] | undefined = undefined

export async function loadAgreements(src: string): Promise<Agreement[]> {
  if (typeof agreementsCache !== 'undefined') {
    return agreementsCache
  }
  const pdfs = (await fs.readdir(src))
    .filter((p) => p.endsWith(".pdf"))
    .map((p) => path.join(src, p));

  const readme = await fs.readFile(`${src}/readme.md`, "utf-8");
  const redirects = parseRedirects(readme);
  const { forbund, sources } = parseReferenceMaps(readme);

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
          thumbnails: agreementThumbnails(slug),
          documents: [],
          forbund: forbund[slug] || [],
          sources: sources[slug] || [],
        };
        agreementMap.set(parseResult.agreementName, agreement);
      }

      const filename = basename;
      const minusExt = filename.slice(0, -4);
      const thumbnails = Object.fromEntries(
        [320].map((size) => [`w${size}`, `${slugify(minusExt)}-${size}.webp`])
      );
      const bytes = (await fs.stat(pdf)).size;

      const gitDir = path.join(src, ".git");
      const workTree = src;
      const command = `git --git-dir="${gitDir}" --work-tree="${workTree}" log --follow --diff-filter=A --format=%aI -- "${filename}"`;
      const buffer = await execAsync(command);
      const stdout = buffer.stdout.toString();
      const created = stdout.trim();

      agreement.documents.push({
        name: parseResult.documentName,
        filename: `${slugify(basename.slice(0, -4))}.pdf`,
        bytes,
        thumbnails,
        rank: parseResult.documentRank,
        language: parseResult.documentLanguage || "sv",
        created: created ? new Date(created) : new Date(),
      });

      agreement.documents.sort((a, b) => a.rank - b.rank);
    })
  );

  for (const redirect of redirects) {
    if (!agreementMap.has(redirect.name)) {
      agreementMap.set(redirect.name, {
        name: redirect.name,
        slug: redirect.slug,
        thumbnails: agreementThumbnails(redirect.slug),
        documents: [],
        forbund: [],
        sources: [],
        redirectTo: redirect.redirectTo,
      });
    }
  }

  const agreements = Array.from(agreementMap.values());
  agreementsCache = agreements
  return agreements;
}

export async function loadAgreement(src: string, slug: string): Promise<Agreement> {
  console.log('loadAgreement')
  const readme = await fs.readFile(`${src}/readme.md`, "utf-8");
  const { forbund, sources } = parseReferenceMaps(readme);

  // Filter PDFs whose agreement name starts with the slug
  const pdfs = (await fs.readdir(src))
    .filter((p) => p.endsWith(".pdf"))
    .filter((p) => slugify(parseFilename(p).agreementName).startsWith(slug))
    .map((p) => path.join(src, p));

  // Use the first PDF to get the agreement name
  const agreementName = parseFilename(path.basename(pdfs[0])).agreementName;

  const agreement: Agreement = {
    name: agreementName,
    slug,
    thumbnails: agreementThumbnails(slug),
    documents: [],
    forbund: forbund[slug] || [],
    sources: sources[slug] || [],
  };

  for (const pdf of pdfs) {
    const basename = path.basename(pdf);
    const parseResult = parseFilename(basename);

    const minusExt = basename.slice(0, -4);
    const thumbnails = Object.fromEntries(
      [320].map((size) => [`w${size}`, `${slugify(minusExt)}-${size}.webp`])
    );
    const bytes = (await fs.stat(pdf)).size;

    const gitDir = path.join(src, ".git");
    const workTree = src;
    const command = `git --git-dir="${gitDir}" --work-tree="${workTree}" log --follow --diff-filter=A --format=%aI -- "${basename}"`;
    const created = (await execAsync(command)).stdout.trim();

    agreement.documents.push({
      name: parseResult.documentName,
      filename: `${slugify(minusExt)}.pdf`,
      bytes,
      thumbnails,
      rank: parseResult.documentRank,
      language: parseResult.documentLanguage || "sv",
      created: created ? new Date(created) : new Date(),
    });
  }

  // Sort documents by rank
  agreement.documents.sort((a, b) => a.rank - b.rank);

  return agreement;
}

