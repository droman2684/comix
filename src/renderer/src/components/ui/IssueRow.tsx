import type { Series, Issue } from '@shared/types'
import { useAppStore } from '@renderer/state/store'
import styles from './IssueRow.module.css'

interface IssueRowProps {
  series: Series
  issue: Issue
  showSeriesMeta: boolean
}

function issueNumberText(displayName: string): string {
  const match = displayName.match(/\d+/)
  return match ? `#${parseInt(match[0], 10)}` : displayName.substring(0, 4)
}

function IssueRow({ series, issue, showSeriesMeta }: IssueRowProps): React.JSX.Element {
  const entry = useAppStore((s) => s.readStatus[issue.key])
  const cover = useAppStore((s) => s.covers[issue.key])
  const openIssue = useAppStore((s) => s.openIssue)
  const toggleRead = useAppStore((s) => s.toggleRead)

  const isRead = entry?.read ?? false
  const page = entry?.page ?? 0
  const total = entry?.total ?? 0
  const inProgress = !isRead && page > 0
  const pct = total ? Math.round((page / total) * 100) : 0
  const numText = issueNumberText(issue.displayName)

  const handleOpen = (): void => {
    openIssue(series, issue)
  }

  return (
    <div className={styles.row} style={{ opacity: isRead ? 0.52 : 1 }}>
      <div className={styles.dot} style={{ background: isRead ? 'transparent' : 'var(--accent-orange)' }} />

      <div
        className={styles.cover}
        style={{
          backgroundColor: series.color,
          backgroundImage: cover ? `url(${cover})` : 'none'
        }}
        onClick={handleOpen}
      >
        {!cover && (
          <div className={styles.issueNum} style={{ fontSize: numText.startsWith('#') ? 20 : 9 }}>
            {numText}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div
          className={styles.title}
          style={{ color: isRead ? 'var(--text-faint)' : 'var(--text-primary)' }}
          onClick={handleOpen}
        >
          {issue.displayName}
        </div>

        {showSeriesMeta ? (
          <div className={styles.meta}>
            <span style={{ color: series.color, fontWeight: 500 }}>{series.name}</span>
            {inProgress && (
              <>
                <span style={{ color: '#d0cdc8' }}>·</span>
                <span>{pct}% read</span>
              </>
            )}
          </div>
        ) : (
          inProgress && <div className={styles.seriesProgressText}>{pct}% read</div>
        )}

        {inProgress && (
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.openBtn} onClick={handleOpen}>
          Open
        </button>
        <button
          className={styles.readBtn}
          style={{
            background: isRead ? '#f0ede8' : '#1a1917',
            color: isRead ? '#6a6158' : '#fff'
          }}
          onClick={(e) => {
            e.stopPropagation()
            toggleRead(issue.key)
          }}
        >
          {isRead ? '↺ Unread' : '✓ Mark Read'}
        </button>
      </div>
    </div>
  )
}

export default IssueRow
