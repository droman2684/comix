import { useAppStore } from '@renderer/state/store'
import WelcomeScreen from '@renderer/components/screens/WelcomeScreen'
import InboxScreen from '@renderer/components/screens/InboxScreen'
import LibraryScreen from '@renderer/components/screens/LibraryScreen'
import SeriesScreen from '@renderer/components/screens/SeriesScreen'
import styles from './MainContent.module.css'

function MainContent(): React.JSX.Element {
  const view = useAppStore((s) => s.view)

  return (
    <div className={styles.main}>
      {view === 'welcome' && <WelcomeScreen />}
      {view === 'inbox' && <InboxScreen />}
      {view === 'library' && <LibraryScreen />}
      {view === 'series' && <SeriesScreen />}
    </div>
  )
}

export default MainContent
