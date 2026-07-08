import type {
  ReadStatus,
  ReadStatusEntry,
  LastRead,
  Series,
  Favorites,
  LibraryViewMode,
  ImportedSeries,
  IssueViewMode
} from './types'

export const IPC_CHANNELS = {
  LIBRARY_PICK_FOLDER: 'library:pickFolder',
  LIBRARY_REOPEN: 'library:reopen',

  CBZ_READ_PAGES: 'cbz:readPages',
  CBZ_READ_COVER: 'cbz:readCover',

  STATE_GET_PERSISTED: 'state:getPersisted',
  STATE_SAVE_READ_STATUS: 'state:saveReadStatus',
  STATE_SAVE_LAST_READ: 'state:saveLastRead',
  STATE_SAVE_ROOT_PATH: 'state:saveRootPath',
  STATE_TOGGLE_FAVORITE: 'state:toggleFavorite',
  STATE_SAVE_LIBRARY_VIEW_MODE: 'state:saveLibraryViewMode',
  STATE_SAVE_SERIES_VIEW_MODE: 'state:saveSeriesViewMode',
  STATE_MARK_SERIES_IMPORTED: 'state:markSeriesImported'
} as const

export interface ScanResult {
  rootPath: string
  series: Series[]
}

export interface PersistedStatePayload {
  rootPath: string | null
  readStatus: ReadStatus
  lastRead: LastRead | null
  favorites: Favorites
  libraryViewMode: LibraryViewMode
  seriesViewMode: IssueViewMode
  importedSeries: ImportedSeries
}

export interface ComicsApi {
  library: {
    pickFolder(): Promise<ScanResult | null>
    reopen(rootPath: string): Promise<ScanResult | null>
  }
  cbz: {
    readPages(rootPath: string, seriesName: string, issueName: string): Promise<string[]>
    readCover(rootPath: string, seriesName: string, issueName: string): Promise<string | null>
  }
  state: {
    getPersisted(): Promise<PersistedStatePayload>
    saveReadStatus(issueKey: string, entry: ReadStatusEntry): Promise<void>
    saveLastRead(lastRead: LastRead | null): Promise<void>
    saveRootPath(rootPath: string | null): Promise<void>
    toggleFavorite(seriesName: string): Promise<void>
    saveLibraryViewMode(mode: LibraryViewMode): Promise<void>
    saveSeriesViewMode(mode: IssueViewMode): Promise<void>
    markSeriesImported(seriesName: string): Promise<void>
  }
}
