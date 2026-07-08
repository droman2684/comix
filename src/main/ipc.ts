import { ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { IPC_CHANNELS } from '@shared/ipcChannels'
import type { ScanResult } from '@shared/ipcChannels'
import type { ReadStatusEntry, LastRead, LibraryViewMode, IssueViewMode } from '@shared/types'
import { getSnapshot, persist } from './persistence'
import { scanLibrary, readComicPages, readComicCover } from './library'
import { readCachedCover, writeCachedCover } from './coverCache'

function scanResult(rootPath: string): ScanResult {
  return { rootPath, series: scanLibrary(rootPath) }
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.LIBRARY_PICK_FOLDER, async (): Promise<ScanResult | null> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled || filePaths.length === 0) return null

    const rootPath = filePaths[0]
    getSnapshot().rootPath = rootPath
    persist()
    return scanResult(rootPath)
  })

  ipcMain.handle(
    IPC_CHANNELS.LIBRARY_REOPEN,
    (_event, rootPath: string): ScanResult | null => {
      if (!existsSync(rootPath)) return null
      return scanResult(rootPath)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CBZ_READ_PAGES,
    (_event, rootPath: string, seriesName: string, issueName: string): Promise<string[]> => {
      const comicPath = join(rootPath, seriesName, issueName)
      return readComicPages(comicPath)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CBZ_READ_COVER,
    async (
      _event,
      rootPath: string,
      seriesName: string,
      issueName: string
    ): Promise<string | null> => {
      const issueKey = `${seriesName}:::${issueName}`
      const cached = readCachedCover(issueKey)
      if (cached) return cached

      const comicPath = join(rootPath, seriesName, issueName)
      const dataUrl = await readComicCover(comicPath)
      if (dataUrl) writeCachedCover(issueKey, dataUrl)
      return dataUrl
    }
  )

  ipcMain.handle(IPC_CHANNELS.STATE_GET_PERSISTED, () => {
    const snapshot = getSnapshot()
    return {
      rootPath: snapshot.rootPath,
      readStatus: snapshot.readStatus,
      lastRead: snapshot.lastRead,
      favorites: snapshot.favorites,
      libraryViewMode: snapshot.libraryViewMode,
      seriesViewMode: snapshot.seriesViewMode,
      importedSeries: snapshot.importedSeries
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.STATE_SAVE_READ_STATUS,
    (_event, issueKey: string, entry: ReadStatusEntry) => {
      getSnapshot().readStatus[issueKey] = entry
      persist()
    }
  )

  ipcMain.handle(IPC_CHANNELS.STATE_SAVE_LAST_READ, (_event, lastRead: LastRead | null) => {
    getSnapshot().lastRead = lastRead
    persist()
  })

  ipcMain.handle(IPC_CHANNELS.STATE_SAVE_ROOT_PATH, (_event, rootPath: string | null) => {
    getSnapshot().rootPath = rootPath
    persist()
  })

  ipcMain.handle(IPC_CHANNELS.STATE_TOGGLE_FAVORITE, (_event, seriesName: string) => {
    const favorites = getSnapshot().favorites
    if (favorites[seriesName]) delete favorites[seriesName]
    else favorites[seriesName] = true
    persist()
  })

  ipcMain.handle(
    IPC_CHANNELS.STATE_SAVE_LIBRARY_VIEW_MODE,
    (_event, mode: LibraryViewMode) => {
      getSnapshot().libraryViewMode = mode
      persist()
    }
  )

  ipcMain.handle(IPC_CHANNELS.STATE_SAVE_SERIES_VIEW_MODE, (_event, mode: IssueViewMode) => {
    getSnapshot().seriesViewMode = mode
    persist()
  })

  ipcMain.handle(IPC_CHANNELS.STATE_MARK_SERIES_IMPORTED, (_event, seriesName: string) => {
    getSnapshot().importedSeries[seriesName] = true
    persist()
  })
}
