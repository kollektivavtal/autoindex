---
name: add-kollektivavtal
description: Add a kollektivavtal PDF, archive metadata, source links and fackforbund-homepage links to the kollektivavtal archive.
---

# Add a kollektivavtal

Use this skill when adding to the kollektivavtal archive. Work carefully across the separate archive and federation repositories.

## Repository locations

The relevant repositories are separate Git repositories:

- `./kollektivavtal-2024`
- `./kollektivavtal-2025`
- `./kollektivavtal-2026`
- `./fackforbund-homepage`

Use the year requested by the user. Do not assume every agreement belongs in the current year: use the archive repository the user specifies.

## Goals

- Download the PDF and add it to `./kollektivavtal-YYYY`
- Add a `readme.md` for it
- Add links to `fackforbund-homepage` from signatories

## Naming the PDF

The PDF name format is `{agreement name} ({document number}) {document name}.pdfA`. For example: `Byggavtalet (1) Kollektivavtal.pdf`. 

- The agreement name needs to differentiate the agreement from others
- The agreement name needs to match across years
- The agreement name needs to be as concise as possible
- The document number controls the ordering of documents on the agreement page
- The document numbers must be sequential and start at 1
- The document name is often just Kollektivavtal
- The document name is sometimes a list of unions, usually when multiple agreements with the same name but different signatories are grouped into a single logical agreement
- The document name is sometimes something like "Löneavtal" when a single agreement is split across multiple documents

## Formatting the readme entry

```md
## Agreement title

### Förbund

- [{union name}](https://fackforbund.github.io/{union slug}/)

### Källor

- https://authoritative-source-page
- https://direct-source-pdf
```

## Linking from fackforbund-homepage

- Each union named under the `## Förbund` section must link back
- Open `./fackforbund-homepage/forbund/{union slug}.md`

```md

## Kollektivavtal

### 2025

- [Byggavtalet](https://kollektivavtal.github.io/2025/byggavtalet/)
```

## The human's role

- Decides what agreements and documents to archive
- Makes final decisions about grouping and naming
- Makes final decisions about signatories

## The agent's role

- Downloads documents and reference URLs as directed by human instruction
- Surfaces context from source URLs to support human decisionmaking
- Surfaces context from other archive years to support human decisionmaking
- Surfaces context from other sources such as Google or memory to support human decisionmaking
- Converts human editorial decisions into filesystem operations
- Converts human editorial decisions into markdown edits

## Validation before finishing

- Check that PDFs are non-empty and identified as a PDF
- Check that sources are listed
- Check that signatories are linked and link back
- Do not commit changes unless explicitly requested.
