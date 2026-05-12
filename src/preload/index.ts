import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

export interface AttachedFile {
  name: string
  content: string
  size: number
}

const api = {
  selectAvatar: () => ipcRenderer.invoke('select-avatar') as Promise<string | null>,
  selectFiles: () => ipcRenderer.invoke('select-files') as Promise<AttachedFile[]>,
  listModels: (baseURL: string, apiKey: string) =>
    ipcRenderer.invoke('ai:listModels', baseURL, apiKey) as Promise<{ name: string; id: string }[]>,
  saveFileDialog: (defaultName: string) =>
    ipcRenderer.invoke('file:saveDialog', defaultName) as Promise<string | null>,
  writeFileChunk: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:writeChunk', filePath, content) as Promise<void>
}

// Use `contextBridge` APIs to expose Electron APIs to renderer
// only if context isolation is enabled
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
