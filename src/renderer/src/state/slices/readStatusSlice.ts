import type { StateCreator } from 'zustand'
import type { ReadStatus, ReadStatusEntry, LastRead } from '@shared/types'
import type { AppState } from '../store'

export interface ReadStatusSlice {
  readStatus: ReadStatus
  lastRead: LastRead | null
  hydrateReadState: (readStatus: ReadStatus, lastRead: LastRead | null) => void
  setLastRead: (lastRead: LastRead | null) => void
  setProgress: (issueKey: string, page: number, total: number) => void
  markRead: (issueKey: string) => void
  toggleRead: (issueKey: string) => void
  markAllRead: (issueKeys: string[]) => void
}

export const createReadStatusSlice: StateCreator<AppState, [], [], ReadStatusSlice> = (
  set,
  get
) => ({
  readStatus: {},
  lastRead: null,

  hydrateReadState: (readStatus, lastRead) => set({ readStatus, lastRead }),

  setLastRead: (lastRead) => {
    set({ lastRead })
    window.api.state.saveLastRead(lastRead)
  },

  // Called on every page turn and on issue open — persisted (debounced in the
  // main process) so progress is never lost.
  setProgress: (issueKey, page, total) => {
    const current = get().readStatus[issueKey]
    const entry: ReadStatusEntry = {
      read: current?.read ?? false,
      page,
      total
    }
    set((state) => ({ readStatus: { ...state.readStatus, [issueKey]: entry } }))
    window.api.state.saveReadStatus(issueKey, entry)
  },

  markRead: (issueKey) => {
    const current = get().readStatus[issueKey]
    const entry: ReadStatusEntry = {
      read: true,
      page: current?.page ?? 0,
      total: current?.total ?? 0
    }
    set((state) => ({ readStatus: { ...state.readStatus, [issueKey]: entry } }))
    window.api.state.saveReadStatus(issueKey, entry)
  },

  toggleRead: (issueKey) => {
    const current = get().readStatus[issueKey]
    const entry: ReadStatusEntry = {
      read: !(current?.read ?? false),
      page: current?.page ?? 0,
      total: current?.total ?? 0
    }
    set((state) => ({ readStatus: { ...state.readStatus, [issueKey]: entry } }))
    window.api.state.saveReadStatus(issueKey, entry)
  },

  markAllRead: (issueKeys) => {
    const next = { ...get().readStatus }
    for (const key of issueKeys) {
      const current = next[key]
      next[key] = { read: true, page: current?.page ?? 0, total: current?.total ?? 0 }
    }
    set({ readStatus: next })
    for (const key of issueKeys) {
      window.api.state.saveReadStatus(key, next[key])
    }
  }
})
