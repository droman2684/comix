import { useAppStore } from '@renderer/state/store'
import IssueRow from '@renderer/components/ui/IssueRow'
import type { Series, Issue } from '@shared/types'
import styles from './SeriesScreen.module.css'

function StarIcon({ filled }: { filled: boolean }): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill={filled ? '#E06B3A' : 'none'}>
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7z"
        stroke={filled ? '#E06B3A' : 'currentColor'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function issueNumberText(displayName: string): string {
  const match = displayName.match(/\d+/)
  return match ? `#${parseInt(match[0], 10)}` : displayName.substring(0, 4)
}

function IssueCard({ series, issue }: { series: Series; issue: Issue }): React.JSX.Element {
  const entry = useAppStore((s) => s.readStatus[issue.key])
  const cover = useAppStore((s) => s.covers[issue.key])
  const openIssue = useAppStore((s) => s.openIssue)

  const isRead = entry?.read ?? false
  const page = entry?.page ?? 0
  const total = entry?.total ?? 0
  const inProgress = !isRead && page > 0
  const pct = total ? Math.round((page / total) * 100) : 0
  const numText = issueNumberText(issue.displayName)

  return (
    <div
      className={styles.issueCard}
      style={{ opacity: isRead ? 0.52 : 1 }}
      onClick={() => openIssue(series, issue)}
    >
      <div
        className={styles.issueCover}
        style={{ backgroundColor: series.color, backgroundImage: cover ? `url(${cover})` : 'none' }}
      >
        {!cover && (
          <div className={styles.issueNum} style={{ fontSize: numText.startsWith('#') ? 20 : 9 }}>
            {numText}
          </div>
        )}
        {!isRead && <div className={styles.unreadDot} />}
      </div>
      <div className={styles.issueCardName}>{issue.displayName}</div>
      {inProgress && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function SeriesScreen(): React.JSX.Element {
  const library = useAppStore((s) => s.library)
  const viewingSeriesName = useAppStore((s) => s.viewingSeriesName)
  const readStatus = useAppStore((s) => s.readStatus)
  const favorites = useAppStore((s) => s.favorites)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const goToLibrary = useAppStore((s) => s.goToLibrary)
  const markAllRead = useAppStore((s) => s.markAllRead)
  const importSeriesCovers = useAppStore((s) => s.importSeriesCovers)
  const seriesViewMode = useAppStore((s) => s.seriesViewMode)
  const setSeriesViewMode = useAppStore((s) => s.setSeriesViewMode)
  const importProgress = useAppStore((s) =>
    viewingSeriesName ? s.importingSeries[viewingSeriesName] : undefined
  )
  const isImported = useAppStore((s) =>
    viewingSeriesName ? !!s.importedSeriesNames[viewingSeriesName] : false
  )

  const series = library.find((s) => s.name === viewingSeriesName)

  if (!series) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <span className={styles.backLink} onClick={goToLibrary}>
            ← Library
          </span>
        </div>
      </div>
    )
  }

  const total = series.issues.length
  const read = series.issues.filter((i) => readStatus[i.key]?.read).length

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <span className={styles.backLink} onClick={goToLibrary}>
          ← Library
        </span>
        <button
          className={styles.starBtn}
          onClick={() => toggleFavorite(series.name)}
          title={favorites[series.name] ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <StarIcon filled={!!favorites[series.name]} />
        </button>
        <h1 className={styles.title}>{series.name}</h1>
        <span className={styles.readLabel}>
          {read} of {total} read
        </span>
        <button
          className={styles.markAllBtn}
          disabled={!!importProgress}
          onClick={() => importSeriesCovers(series)}
        >
          {importProgress
            ? `Importing… (${importProgress.done}/${importProgress.total})`
            : isImported
              ? 'Re-import Cover Art'
              : 'Import Cover Art'}
        </button>
        <button
          className={styles.markAllBtn}
          onClick={() => markAllRead(series.issues.map((i) => i.key))}
        >
          Mark all read
        </button>
        <div className={styles.viewToggle}>
          <div
            className={styles.viewToggleOption}
            style={{
              background: seriesViewMode === 'list' ? '#1a1917' : 'transparent',
              color: seriesViewMode === 'list' ? '#f0ede8' : '#7a7872'
            }}
            onClick={() => setSeriesViewMode('list')}
          >
            List
          </div>
          <div
            className={styles.viewToggleOption}
            style={{
              background: seriesViewMode === 'card' ? '#1a1917' : 'transparent',
              color: seriesViewMode === 'card' ? '#f0ede8' : '#7a7872'
            }}
            onClick={() => setSeriesViewMode('card')}
          >
            Card
          </div>
        </div>
      </div>
      {seriesViewMode === 'list' ? (
        <div className={styles.body}>
          {series.issues.map((issue) => (
            <IssueRow key={issue.key} series={series} issue={issue} showSeriesMeta={false} />
          ))}
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {series.issues.map((issue) => (
            <IssueCard key={issue.key} series={series} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}

export default SeriesScreen
