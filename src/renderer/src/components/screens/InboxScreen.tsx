import { useAppStore } from '@renderer/state/store'
import IssueRow from '@renderer/components/ui/IssueRow'
import type { Series, Issue } from '@shared/types'
import styles from './InboxScreen.module.css'

function InboxScreen(): React.JSX.Element {
  const library = useAppStore((s) => s.library)
  const readStatus = useAppStore((s) => s.readStatus)
  const inboxFilter = useAppStore((s) => s.inboxFilter)
  const setInboxFilter = useAppStore((s) => s.setInboxFilter)
  const markAllRead = useAppStore((s) => s.markAllRead)

  let issues: Array<{ series: Series; issue: Issue }> = library.flatMap((series) =>
    series.issues.map((issue) => ({ series, issue }))
  )
  if (inboxFilter === 'unread') {
    issues = issues.filter(({ issue }) => !readStatus[issue.key]?.read)
  }

  const unreadCount = issues.filter(({ issue }) => !readStatus[issue.key]?.read).length

  const handleMarkAllRead = (): void => {
    if (unreadCount === 0) return
    const ok = window.confirm(
      `Mark ${unreadCount} issue${unreadCount === 1 ? '' : 's'} in your entire library as read?`
    )
    if (!ok) return
    markAllRead(issues.map(({ issue }) => issue.key))
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inbox</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.markAllBtn}
            disabled={unreadCount === 0}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
          <div className={styles.filterPills}>
            <div
              className={styles.pill}
              style={{
                background: inboxFilter === 'unread' ? '#1a1917' : 'transparent',
                color: inboxFilter === 'unread' ? '#f0ede8' : '#7a7872'
              }}
              onClick={() => setInboxFilter('unread')}
            >
              Unread
            </div>
            <div
              className={styles.pill}
              style={{
                background: inboxFilter === 'all' ? '#1a1917' : 'transparent',
                color: inboxFilter === 'all' ? '#f0ede8' : '#7a7872'
              }}
              onClick={() => setInboxFilter('all')}
            >
              All
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {issues.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✓</div>
            <div className={styles.emptyTitle}>All caught up</div>
            <div className={styles.emptySubtitle}>No unread issues in your library</div>
            <div className={styles.emptyAction} onClick={() => setInboxFilter('all')}>
              Show all issues →
            </div>
          </div>
        ) : (
          issues.map(({ series, issue }) => (
            <IssueRow key={issue.key} series={series} issue={issue} showSeriesMeta />
          ))
        )}
      </div>
    </div>
  )
}

export default InboxScreen
