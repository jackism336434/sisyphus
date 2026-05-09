import { ipcMain } from 'electron'
import type { AIConfig, ChatMessage } from './ai-types'

export function registerAIHandlers(): void {
  ipcMain.handle('ai:listModels', async (_event, baseURL: string, apiKey: string) => {
    try {
      const url = baseURL.replace(/\/+$/, '') + '/models'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          return []
        }
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m: { id: string }) => ({
          name: m.id,
          id: m.id
        }))
      }
      return []
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  ipcMain.handle('ai:chat', async (_event, config: AIConfig, messages: ChatMessage[]) => {
    try {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        throw new Error(`AI API error ${response.status}: ${errBody}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  ipcMain.handle('ai:chatStream', async (event, config: AIConfig, messages: ChatMessage[]) => {
    const sender = event.sender

    try {
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        sender.send('ai:streamError', `AI API error ${response.status}: ${errBody}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        sender.send('ai:streamError', 'No response body')
        return
      }

      const rawChunks: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawChunks.push(value)
      }

      const fullText = Buffer.concat(rawChunks.map((c) => Buffer.from(c))).toString('utf-8')

      let fullContent = ''
      for (const line of fullText.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        try {
          const content = JSON.parse(data).choices?.[0]?.delta?.content
          if (content) fullContent += content
        } catch {
          // skip unparseable
        }
      }

      for (let i = 0; i < fullContent.length; i += 3) {
        sender.send('ai:streamChunk', fullContent.slice(i, i + 3))
      }
      sender.send('ai:streamEnd')
    } catch (error) {
      sender.send(
        'ai:streamError',
        `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}
