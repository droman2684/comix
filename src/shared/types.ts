// Domain types shared between the main process (source of truth) and the renderer
// (consumer via IPC). Keep these free of any UI-only concerns (nav state, filters, etc.)
// — those stay in src/renderer/src/types/index.ts.

export interface Issue {
  name: string // filename on disk, e.g. "Saga #001.cbz"
  displayName: string // filename without extension, e.g. "Saga #001"
  key: string // stable id: "SeriesName:::filename.ext"
  isCBR: boolean
}

export interface Series {
  name: string
  color: string
  issues: Issue[]
}

export interface ReadStatusEntry {
  read: boolean
  page: number
  total: number
}

export type ReadStatus = Record<string, ReadStatusEntry>

export interface LastRead {
  issueKey: string
  seriesName: string
  issueName: string
  page: number
  total: number
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

// Keyed by series name — true means the series is pinned to the sidebar
// favorites list.
export type Favorites = Record<string, boolean>

export type LibraryViewMode = 'grid' | 'list'

// Keyed by series name — true means "Import Cover Art" has completed for
// every issue in that series, so a future visit can silently re-fetch every
// cover (fast, served from the on-disk cover cache) instead of requiring the
// user to click the button again.
export type ImportedSeries = Record<string, boolean>

export type IssueViewMode = 'list' | 'card'
