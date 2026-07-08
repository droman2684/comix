import { useAppStore } from './store'

// Pulls persisted readStatus/lastRead/rootPath from the main process and, if
// a library root was saved from a previous session, silently re-scans it —
// unlike the browser prototype (whose File System Access API handles don't
// survive a reload), Electron can read the remembered path with no user
// interaction. Falls back to the Welcome screen if the path is missing or
// contains no readable series.
export async function hydrateApp(): Promise<void> {
  const store = useAppStore.getState()
  const persisted = await window.api.state.getPersisted()
  store.hydrateReadState(persisted.readStatus, persisted.lastRead)
  store.hydrateFavorites(persisted.favorites)
  store.hydrateImportedSeries(persisted.importedSeries)
  useAppStore.setState({
    libraryViewMode: persisted.libraryViewMode,
    seriesViewMode: persisted.seriesViewMode
  })

  if (persisted.rootPath) {
    // Set eagerly so the Welcome screen can still show "Reopen Your Library —
    // Previous library: <name>" if the re-scan below fails (e.g. a removable
    // drive that isn't mounted yet).
    useAppStore.setState({ rootPath: persisted.rootPath })
    await store.reopenLibrary(persisted.rootPath)
  }
}
