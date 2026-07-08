import type { StateCreator } from 'zustand'
import type { Series } from '@shared/types'
import type { ScanResult } from '@shared/ipcChannels'
import { buildDemoLibrary } from '@renderer/utils/demoData'
import type { AppState } from '../store'

export interface LibrarySlice {
  library: Series[]
  rootPath: string | null
  isScanning: boolean
  scanError: string | null
  applyScanResult: (result: ScanResult) => void
  pickFolder: () => Promise<void>
  reopenLibrary: (rootPath: string) => Promise<boolean>
  loadDemoLibrary: () => void
}

export const createLibrarySlice: StateCreator<AppState, [], [], LibrarySlice> = (set, get) => ({
  library: [],
  rootPath: null,
  isScanning: false,
  scanError: null,

  applyScanResult: (result) => {
    set({
      library: result.series,
      rootPath: result.rootPath,
      view: 'inbox',
      scanError: null
    })
  },

  pickFolder: async () => {
    set({ isScanning: true, scanError: null })
    try {
      const result = await window.api.library.pickFolder()
      if (!result) {
        set({ isScanning: false })
        return
      }
      if (result.series.length === 0) {
        set({
          isScanning: false,
          scanError: 'No series found. Make sure the folder contains subfolders with .cbz files.'
        })
        return
      }
      get().applyScanResult(result)
      set({ isScanning: false })
    } catch (err) {
      console.error('Failed to open folder:', err)
      set({ isScanning: false, scanError: 'Something went wrong opening that folder.' })
    }
  },

  // Re-scans a previously saved root path without prompting the user again —
  // the nice-to-have Electron affords over the browser prototype's File
  // System Access API, which loses folder handles across reloads.
  reopenLibrary: async (rootPath) => {
    set({ isScanning: true, scanError: null })
    try {
      const result = await window.api.library.reopen(rootPath)
      if (!result || result.series.length === 0) {
        set({ isScanning: false })
        return false
      }
      get().applyScanResult(result)
      set({ isScanning: false })
      return true
    } catch (err) {
      console.error('Failed to reopen library:', err)
      set({ isScanning: false })
      return false
    }
  },

  loadDemoLibrary: () => {
    const { library, readStatus, lastRead, covers } = buildDemoLibrary()
    set((state) => ({
      library,
      rootPath: null,
      view: 'inbox',
      readStatus,
      lastRead,
      covers: { ...state.covers, ...covers }
    }))
  }
})
