import { ElectronAPI } from '@electron-toolkit/preload'
import type { ComicsApi } from '@shared/ipcChannels'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ComicsApi
  }
}
