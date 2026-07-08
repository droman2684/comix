import { app } from 'electron'
import { join } from 'node:path'
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
import type {
  ReadStatus,
  ReadStatusEntry,
  LastRead,
  WindowBounds,
  Favorites,
  LibraryViewMode,
  ImportedSeries,
  IssueViewMode
} from '@shared/types'

export interface PersistedData {
  version: 1
  rootPath: string | null
  readStatus: ReadStatus
  lastRead: LastRead | null
  windowBounds: WindowBounds | null
  favorites: Favorites
  libraryViewMode: LibraryViewMode
  seriesViewMode: IssueViewMode
  importedSeries: ImportedSeries
}

function defaults(): PersistedData {
  return {
    version: 1,
    rootPath: null,
    readStatus: {},
    lastRead: null,
    windowBounds: null,
    favorites: {},
    libraryViewMode: 'grid',
    seriesViewMode: 'list',
    importedSeries: {}
  }
}

function filePath(): string {
  return join(app.getPath('userData'), 'comics-data.json')
}

let data: PersistedData | null = null
let writeTimer: ReturnType<typeof setTimeout> | null = null

// Defends against data written by an older/newer build with a slightly different
// shape for these records — without this, a stale or malformed entry on disk
// could crash the renderer (e.g. reading `.read` off a non-object entry).
export function normalize(parsed: PersistedData): PersistedData {
  const readStatus: ReadStatus = {}
  for (const [key, entry] of Object.entries(parsed.readStatus ?? {})) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Partial<ReadStatusEntry>
    readStatus[key] = {
      read: Boolean(e.read),
      page: typeof e.page === 'number' ? e.page : 0,
      total: typeof e.total === 'number' ? e.total : 0
    }
  }

  const lr = parsed.lastRead
  const lastRead: LastRead | null =
    lr &&
    typeof lr.issueKey === 'string' &&
    typeof lr.seriesName === 'string' &&
    typeof lr.issueName === 'string' &&
    typeof lr.page === 'number' &&
    typeof lr.total === 'number'
      ? lr
      : null

  const bounds = parsed.windowBounds
  const windowBounds =
    bounds &&
    typeof bounds.x === 'number' &&
    typeof bounds.y === 'number' &&
    typeof bounds.width === 'number' &&
    typeof bounds.height === 'number'
      ? bounds
      : null

  const rootPath = typeof parsed.rootPath === 'string' ? parsed.rootPath : null

  const favorites: Favorites = {}
  for (const [key, value] of Object.entries(parsed.favorites ?? {})) {
    if (value) favorites[key] = true
  }

  const libraryViewMode: LibraryViewMode = parsed.libraryViewMode === 'list' ? 'list' : 'grid'
  const seriesViewMode: IssueViewMode = parsed.seriesViewMode === 'card' ? 'card' : 'list'

  const importedSeries: ImportedSeries = {}
  for (const [key, value] of Object.entries(parsed.importedSeries ?? {})) {
    if (value) importedSeries[key] = true
  }

  return {
    ...parsed,
    rootPath,
    readStatus,
    lastRead,
    windowBounds,
    favorites,
    libraryViewMode,
    seriesViewMode,
    importedSeries
  }
}

function load(): PersistedData {
  const path = filePath()
  if (!existsSync(path)) return defaults()
  try {
    const raw = readFileSync(path, 'utf-8')
    const parsed = JSON.parse(raw) as PersistedData
    return normalize({ ...defaults(), ...parsed })
  } catch (err) {
    console.error('Failed to read persisted data, starting fresh:', err)
    return defaults()
  }
}

export function getSnapshot(): PersistedData {
  if (!data) data = load()
  return data
}

function writeNow(): void {
  const path = filePath()
  const tmpPath = `${path}.tmp`
  writeFileSync(tmpPath, JSON.stringify(getSnapshot(), null, 2), 'utf-8')
  renameSync(tmpPath, path)
}

export function persist(): void {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    writeNow()
  }, 250)
}

export function persistNow(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  writeNow()
}
