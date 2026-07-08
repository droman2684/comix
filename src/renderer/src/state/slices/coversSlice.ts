import type { StateCreator } from 'zustand'
import type { Series, Issue, ImportedSeries } from '@shared/types'
import { DEMO_PREFIX } from '@renderer/utils/demoData'
import { runWithConcurrency } from '@renderer/utils/pool'
import type { AppState } from '../store'

const IMPORT_CONCURRENCY = 4

export interface CoverImportProgress {
  done: number
  total: number
}

export interface CoversSlice {
  covers: Record<string, string>
  importingSeries: Record<string, CoverImportProgress>
  importedSeriesNames: ImportedSeries
  setCover: (issueKey: string, dataUrl: string) => void
  hydrateImportedSeries: (importedSeries: ImportedSeries) => void
  loadIssueCoverIfNeeded: (series: Series, issue: Issue) => Promise<void>
  importSeriesCovers: (series: Series) => Promise<void>
}

export const createCoversSlice: StateCreator<AppState, [], [], CoversSlice> = (set, get) => ({
  covers: {},
  importingSeries: {},
  importedSeriesNames: {},

  hydrateImportedSeries: (importedSeries) => set({ importedSeriesNames: importedSeries }),

  setCover: (issueKey, dataUrl) => {
    set((state) => ({ covers: { ...state.covers, [issueKey]: dataUrl } }))
  },

  // Fetches just the cover page of a single issue (cheap — a single ZIP/RAR
  // entry, not the whole archive) — see the README's Cover Caching section.
  loadIssueCoverIfNeeded: async (series, issue) => {
    if (get().covers[issue.key]) return
    if (issue.key.startsWith(DEMO_PREFIX)) return // demo covers are pre-seeded

    const rootPath = get().rootPath
    if (!rootPath) return
    try {
      const dataUrl = await window.api.cbz.readCover(rootPath, series.name, issue.name)
      if (dataUrl) get().setCover(issue.key, dataUrl)
    } catch (err) {
      console.error('Failed to load cover:', err)
    }
  },

  // Bulk-fetches covers for every issue in a series, a few at a time, so a
  // user can opt into full per-issue cover art (e.g. for a Series view)
  // without the app eagerly decompressing every archive in the library.
  // Once done, the series is flagged as "imported" (persisted) so a future
  // visit silently re-fetches every cover from the on-disk cache — fast,
  // no archive decompression — instead of requiring another manual click.
  importSeriesCovers: async (series) => {
    const pending = series.issues.filter((issue) => !get().covers[issue.key])

    if (pending.length > 0) {
      const total = pending.length
      set((state) => ({
        importingSeries: { ...state.importingSeries, [series.name]: { done: 0, total } }
      }))

      let done = 0
      await runWithConcurrency(pending, IMPORT_CONCURRENCY, async (issue) => {
        await get().loadIssueCoverIfNeeded(series, issue)
        done += 1
        set((state) => ({
          importingSeries: { ...state.importingSeries, [series.name]: { done, total } }
        }))
      })

      set((state) => {
        const next = { ...state.importingSeries }
        delete next[series.name]
        return { importingSeries: next }
      })
    }

    if (!get().importedSeriesNames[series.name]) {
      set((state) => ({
        importedSeriesNames: { ...state.importedSeriesNames, [series.name]: true }
      }))
      window.api.state.markSeriesImported(series.name)
    }
  }
})
