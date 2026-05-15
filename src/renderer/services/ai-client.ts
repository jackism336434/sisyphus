// src/renderer/services/ai-client.ts
import type { ChatMessage } from '../stores/conversationStore'
import type { AIProvider } from '../stores/appStore'
import { logger } from '../logger'

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

type StreamCallbacks = {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function sendChatMessage(
  config: AIConfig,
  messages: ChatMessage[]
): Promise<string> {
  logger.debug(`[AI] Sending chat request to ${config.baseURL} (model: ${config.model})`)
  const startTime = Date.now()
  try {
    const result = await window.electron.ipcRenderer.invoke('ai:chat', config, messages)
    logger.info(`[AI] Chat response received, ${(result as string).length} chars (${Date.now() - startTime}ms)`)
    return result as string
  } catch (error) {
    logger.error(`[AI] Chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

export async function sendChatMessageStream(
  config: AIConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks

  logger.debug(`[AI] Starting stream request to ${config.baseURL} (model: ${config.model})`)
  const startTime = Date.now()
  let totalChars = 0

  const chunkHandler = (_event: Electron.IpcRendererEvent, chunk: string): void => {
    totalChars += chunk.length
    onChunk(chunk)
  }
  const endHandler = (): void => {
    cleanup()
    logger.info(`[AI] Stream complete, ${totalChars} chars (${Date.now() - startTime}ms)`)
    onDone()
  }
  const errorHandler = (_event: Electron.IpcRendererEvent, error: string): void => {
    cleanup()
    logger.error(`[AI] Stream error: ${error}`)
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

  try {
    await window.electron.ipcRenderer.invoke('ai:chatStream', config, messages)
  } catch (error) {
    cleanup()
    logger.error(`[AI] Stream invoke failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    onError(error instanceof Error ? error.message : 'Unknown error')
  }
}
