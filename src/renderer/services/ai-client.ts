import type { ChatMessage } from '../stores/conversationStore'
import type { AIProvider } from '../stores/appStore'

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

// Stream callbacks
type StreamCallbacks = {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function sendChatMessage(
  config: AIConfig,
  messages: ChatMessage[]
): Promise<string> {
  const result = await window.electron.ipcRenderer.invoke('ai:chat', config, messages)
  return result as string
}

export async function sendChatMessageStream(
  config: AIConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks

  // Register listeners
  const chunkHandler = (_event: Electron.IpcRendererEvent, chunk: string): void => {
    onChunk(chunk)
  }
  const endHandler = (): void => {
    cleanup()
    onDone()
  }
  const errorHandler = (_event: Electron.IpcRendererEvent, error: string): void => {
    cleanup()
    onError(error)
  }

  const cleanup = (): void => {
    window.electron.ipcRenderer.removeAllListeners('ai:streamChunk')
    window.electron.ipcRenderer.removeAllListeners('ai:streamEnd')
    window.electron.ipcRenderer.removeAllListeners('ai:streamError')
  }

  window.electron.ipcRenderer.on('ai:streamChunk', chunkHandler)
  window.electron.ipcRenderer.on('ai:streamEnd', endHandler)
  window.electron.ipcRenderer.on('ai:streamError', errorHandler)

  // Trigger the stream
  await window.electron.ipcRenderer.invoke('ai:chatStream', config, messages)
}
