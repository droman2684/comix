import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import AdmZip from 'adm-zip'
import unrarPkg from 'node-unrar-js'
import type { Series, Issue } from '@shared/types'

const { createExtractorFromData } = unrarPkg

const COLORS = [
  '#4A9BE8',
  '#E8943A',
  '#48B87A',
  '#5A8FD4',
  '#8B5CF6',
  '#E05C5C',
  '#06B6D4',
  '#D97706',
  '#84CC16',
  '#F43F5E',
  '#A855F7',
  '#14B8A6'
]

// Deterministic accent color per series name — copied verbatim from the design
// handoff so hues stay stable across the browser prototype and this app.
export function seriesColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return COLORS[((h % COLORS.length) + COLORS.length) % COLORS.length]
}

const COMIC_EXT = /\.(cbz|cbr)$/i
const CBR_EXT = /\.cbr$/i
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

// Each top-level subfolder of the root is a series; comic files directly
// inside it are issues. Non-directory entries and folders with no readable
// issues are skipped.
export function scanLibrary(rootPath: string): Series[] {
  const library: Series[] = []
  let rootEntries: string[]
  try {
    rootEntries = readdirSync(rootPath)
  } catch (err) {
    console.error('Failed to read library root:', err)
    return []
  }

  for (const seriesName of rootEntries) {
    if (seriesName.startsWith('.')) continue
    const seriesPath = join(rootPath, seriesName)
    let stat
    try {
      stat = statSync(seriesPath)
    } catch {
      continue
    }
    if (!stat.isDirectory()) continue

    let files: string[]
    try {
      files = readdirSync(seriesPath)
    } catch {
      continue
    }

    const issues: Issue[] = files
      // Drive-to-drive copies (especially to/from exFAT or network volumes)
      // leave an AppleDouble sidecar file "._Name.cbz" next to every real
      // "Name.cbz" — without this filter each real issue shows up twice.
      .filter((f) => COMIC_EXT.test(f) && !f.startsWith('._'))
      .map((fname) => ({
        name: fname,
        displayName: fname.replace(COMIC_EXT, ''),
        key: `${seriesName}:::${fname}`,
        isCBR: CBR_EXT.test(fname)
      }))
      .sort((a, b) => naturalCompare(a.name, b.name))

    if (issues.length === 0) continue

    library.push({ name: seriesName, color: seriesColor(seriesName), issues })
  }

  library.sort((a, b) => naturalCompare(a.name, b.name))
  return library
}

// Return type is left to inference (rather than named as AdmZip.IZipEntry[])
// so this doesn't depend on knowing @types/adm-zip's exact exported type name.
function imageEntriesSorted(zip: AdmZip) {
  return zip
    .getEntries()
    .filter((e) => !e.isDirectory && IMAGE_EXT.test(e.entryName) && !basename(e.entryName).startsWith('.'))
    .sort((a, b) => naturalCompare(a.entryName, b.entryName))
}

function mimeFor(entryName: string): string {
  const ext = extname(entryName).toLowerCase()
  switch (ext) {
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    default:
      return 'image/jpeg'
  }
}

// Reads every page of a CBZ (ZIP archive) as a base64 data URL, sorted in
// natural filename order ("page2.jpg" before "page10.jpg"). Simplest correct
// way to hand image bytes to the renderer over ipcRenderer.invoke.
export function readCbzPages(cbzPath: string): string[] {
  const zip = new AdmZip(cbzPath)
  const entries = imageEntriesSorted(zip)
  return entries.map((entry) => {
    const data = zip.readFile(entry)
    const base64 = data ? data.toString('base64') : ''
    return `data:${mimeFor(entry.entryName)};base64,${base64}`
  })
}

// The cover is just the first page of a CBZ. Reading only that single ZIP
// entry (instead of the whole archive via readCbzPages) is what makes it
// cheap enough to call when a series/issue is merely browsed to, not opened
// in the reader — see the README's Cover Caching section.
export function readCbzCover(cbzPath: string): string | null {
  const zip = new AdmZip(cbzPath)
  const entries = imageEntriesSorted(zip)
  if (entries.length === 0) return null
  const first = entries[0]
  const data = zip.readFile(first)
  if (!data) return null
  return `data:${mimeFor(first.entryName)};base64,${data.toString('base64')}`
}

async function openRarExtractor(cbrPath: string) {
  const buf = readFileSync(cbrPath)
  return createExtractorFromData({ data: new Uint8Array(buf).buffer })
}

function isReadableImage(fileHeader: { flags: { directory: boolean }; name: string }): boolean {
  return (
    !fileHeader.flags.directory &&
    IMAGE_EXT.test(fileHeader.name) &&
    !basename(fileHeader.name).startsWith('.')
  )
}

// Reads every page of a CBR (RAR archive) as a base64 data URL, sorted in
// natural filename order. RAR extraction is pure-JS/WASM (node-unrar-js) so
// no native binary or system `unrar` install is required.
export async function readCbrPages(cbrPath: string): Promise<string[]> {
  const extractor = await openRarExtractor(cbrPath)
  const { files } = extractor.extract({ files: isReadableImage })

  const result: Array<{ name: string; data: Uint8Array }> = []
  for (const file of files) {
    if (file.extraction) result.push({ name: file.fileHeader.name, data: file.extraction })
  }
  result.sort((a, b) => naturalCompare(a.name, b.name))
  return result.map(
    (f) => `data:${mimeFor(f.name)};base64,${Buffer.from(f.data).toString('base64')}`
  )
}

// Listing the header table is cheap (no decompression); only the single
// cover entry is actually extracted, so this stays fast even when called
// automatically for every series' first issue in the Library view.
export async function readCbrCover(cbrPath: string): Promise<string | null> {
  const extractor = await openRarExtractor(cbrPath)
  const names = [...extractor.getFileList().fileHeaders]
    .filter(isReadableImage)
    .map((fh) => fh.name)
    .sort(naturalCompare)
  if (names.length === 0) return null

  const first = names[0]
  const { files } = extractor.extract({ files: [first] })
  const file = [...files][0]
  if (!file?.extraction) return null
  return `data:${mimeFor(first)};base64,${Buffer.from(file.extraction).toString('base64')}`
}

// Dispatches to the CBZ or CBR reader based on file extension — the two
// IPC handlers stay format-agnostic and just call these.
export async function readComicPages(comicPath: string): Promise<string[]> {
  return CBR_EXT.test(comicPath) ? readCbrPages(comicPath) : readCbzPages(comicPath)
}

export async function readComicCover(comicPath: string): Promise<string | null> {
  return CBR_EXT.test(comicPath) ? readCbrCover(comicPath) : readCbzCover(comicPath)
}

