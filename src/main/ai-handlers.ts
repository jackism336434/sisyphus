import { ipcMain } from 'electron'
import type { AIConfig, ChatMessage } from './ai-types'

export function registerAIHandlers(): void {
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
    // Store the request context for streaming
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

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          sender.send('ai:streamEnd')
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            sender.send('ai:streamEnd')
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              sender.send('ai:streamChunk', content)
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
    } catch (error) {
      sender.send(
        'ai:streamError',
        `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}
