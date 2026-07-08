import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/ipcChannels'
import type { ComicsApi } from '@shared/ipcChannels'

const api: ComicsApi = {
  library: {
    pickFolder: () => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_PICK_FOLDER),
    reopen: (rootPath) => ipcRenderer.invoke(IPC_CHANNELS.LIBRARY_REOPEN, rootPath)
  },
  cbz: {
    readPages: (rootPath, seriesName, issueName) =>
      ipcRenderer.invoke(IPC_CHANNELS.CBZ_READ_PAGES, rootPath, seriesName, issueName),
    readCover: (rootPath, seriesName, issueName) =>
      ipcRenderer.invoke(IPC_CHANNELS.CBZ_READ_COVER, rootPath, seriesName, issueName)
  },
  state: {
    getPersisted: () => ipcRenderer.invoke(IPC_CHANNELS.STATE_GET_PERSISTED),
    saveReadStatus: (issueKey, entry) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE_READ_STATUS, issueKey, entry),
    saveLastRead: (lastRead) => ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE_LAST_READ, lastRead),
    saveRootPath: (rootPath) => ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE_ROOT_PATH, rootPath),
    toggleFavorite: (seriesName) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATE_TOGGLE_FAVORITE, seriesName),
    saveLibraryViewMode: (mode) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE_LIBRARY_VIEW_MODE, mode),
    saveSeriesViewMode: (mode) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATE_SAVE_SERIES_VIEW_MODE, mode),
    markSeriesImported: (seriesName) =>
      ipcRenderer.invoke(IPC_CHANNELS.STATE_MARK_SERIES_IMPORTED, seriesName),
    clearLibrary: () => ipcRenderer.invoke(IPC_CHANNELS.STATE_CLEAR_LIBRARY)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
