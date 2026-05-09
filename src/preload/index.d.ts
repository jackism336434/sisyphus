import { electronAPI } from '@electron-toolkit/preload'

interface AttachedFile {
  name: string
  content: string
  size: number
}

declare global {
  interface Window {
    electron: typeof electronAPI
    api: {
      selectAvatar: () => Promise<string | null>
      selectFiles: () => Promise<AttachedFile[]>
      listModels: (baseURL: string, apiKey: string) => Promise<{ name: string; id: string }[]>
    }
  }
}
