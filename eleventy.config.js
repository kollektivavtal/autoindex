import { promises as fs } from 'fs'
import path from 'path'
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";


export default async function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin,{
    // baseHref: eleventyConfig.pathPrefix,
  });

  eleventyConfig.addCollection("agreements", async function() {
    const files = await fs.readdir('.', { withFileTypes: true })

    const pdfs = files
      .filter((file) => file.isFile() && path.extname(file.name).toLowerCase() === '.pdf')
      .map((file) => {
        const filename = file.name
        const basename = path.basename(filename, '.pdf')
        const parts = basename.split(' – ')
        const group = parts[0]
        return {
          basename,
          filename,
          group,
        }
      })

    const agreements = new Map()
    pdfs.forEach((item) => {
      let agreement = agreements.get(item.group)
      if (!agreement) {
        const name = item.group
        const slug = name.toLowerCase().replace(/ /g, '-')
        agreement = {
          name,
          slug,
          documents: [],
        }
        agreements.set(item.group, agreement)
      }

      const filename = item.filename
      let basename = item.basename
      if (basename.includes(' – ')) {
        const parts = basename.split(' – ')
        basename = parts[1]
      }

      agreement.documents.push({
        filename,
        basename,
      })
    })

    return [...agreements.values()]
  })

  let pathPrefix = "/"
  let outputDir = "_site"

  if (process.env.ELEVENTY_ENV !== 'production') {
    pathPrefix = `/${process.env.YEAR}/`
    outputDir = `_site/${process.env.YEAR}`
  }

  return {
    pathPrefix,
    dir: {
      output: outputDir,
    },
  }
}
