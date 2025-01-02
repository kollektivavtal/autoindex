import { promises as fs } from 'fs'
import path from 'path'
import { EleventyHtmlBasePlugin } from "@11ty/eleventy"
import sharp from 'sharp'
import { fromPath } from 'pdf2pic'
import * as sass from 'sass'

export default async function(eleventyConfig) {
  const pathPrefix = `/${process.env.YEAR}/`
  let outputDir = "_site"

  if (process.env.ELEVENTY_ENV !== 'production') {
    outputDir = `_site/${process.env.YEAR}`
  }

  eleventyConfig.addTemplateFormats('scss')
  eleventyConfig.addExtension('scss', {
    outputFileExtension: 'css',
    compile(content, inputPath) {
      let parsed = path.parse(inputPath)
      if (parsed.name.startsWith('_')) return
      console.log('🔮 compiling scss...', inputPath)
      return (data) => {
        let result = sass.compile(inputPath)
        return result.css
      }
    },
  })

  async function generateThumbnails(pdfPath) {
    const basename = path.basename(pdfPath, '.pdf')
    const convert = fromPath(pdfPath, {
      density: 100,
      saveFilename: basename,
      preserveAspectRatio: true,
      savePath: outputDir,
      format: "webp",
    })
    const output = await convert(1)
    const thumbnailPaths = []
    for (const size of [32, 64, 128, 512]) {
      const thumbnailPath = `${outputDir}/${basename}-${size}.webp`
      await sharp(output.path)
        .resize(size)
        .webp({ quality: 80 })
        .toFile(thumbnailPath)
      thumbnailPaths.push([`w${size}`, path.relative(outputDir, thumbnailPath)])
    }
    return Object.fromEntries(thumbnailPaths)
  }

  eleventyConfig.addPassthroughCopy('*.pdf')

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin,{
    // baseHref: eleventyConfig.pathPrefix,
  })

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

    await Promise.all(pdfs.map(async (item) => {
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

      const pdfPath = path.resolve(filename)
      const thumbnails = await generateThumbnails(pdfPath)

      agreement.documents.push({
        filename,
        basename,
        thumbnails,
      })
      console.log(agreement.documents)
    }))

    return [...agreements.values()]
  })

  return {
    pathPrefix,
    dir: {
      output: outputDir,
    },
  }
}
