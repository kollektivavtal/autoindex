import { promises as fs } from 'fs'
import path from 'path'

export default async function () {
  const files = await fs.readdir('.', { withFileTypes: true })

  const pdfs = files
    .filter((file) =>
      file.isFile() &&
      path.extname(file.name).toLowerCase() === '.pdf'
    )
    .map((file) => ({
      basename: path.basename(file.name, '.pdf'),
      filename: file.name,
    }))

  return pdfs
}