import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

// Covers are cached on disk (keyed by a hash of the issue key) so a page
// already decompressed once — whether by the Library view's automatic
// first-issue load or a "Import Cover Art" run — never needs re-extracting
// from the archive again, even across app restarts.
function coversDir(): string {
  return join(app.getPath('userData'), 'covers')
}

function cacheFilePath(issueKey: string): string {
  const hash = createHash('sha1').update(issueKey).digest('hex')
  return join(coversDir(), `${hash}.txt`)
}

export function readCachedCover(issueKey: string): string | null {
  const path = cacheFilePath(issueKey)
  if (!existsSync(path)) return null
  try {
    return readFileSync(path, 'utf-8')
  } catch (err) {
    console.error('Failed to read cached cover:', err)
    return null
  }
}

export function writeCachedCover(issueKey: string, dataUrl: string): void {
  try {
    const dir = coversDir()
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(cacheFilePath(issueKey), dataUrl, 'utf-8')
  } catch (err) {
    console.error('Failed to write cached cover:', err)
  }
}
