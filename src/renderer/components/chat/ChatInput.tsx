import { useState, useRef, useEffect } from 'react'
import { useAppStore, AI_MODELS } from '../../stores/appStore'
import { useChatStore, nextId } from '../../stores/chatStore'
import { sendChatMessageStream } from '../../services/ai-client'

export default function ChatInput(): JSX.Element {
  const [value, setValue] = useState('')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedProvider = useAppStore((s) => s.selectedProvider)
  const selectedModel = useAppStore((s) => s.selectedModel)
  const setProvider = useAppStore((s) => s.setProvider)
  const setModel = useAppStore((s) => s.setModel)
  const getCurrentConfig = useAppStore((s) => s.getCurrentConfig)

  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const addMessage = useChatStore((s) => s.addMessage)
  const setLoading = useChatStore((s) => s.setLoading)
  const appendStreamContent = useChatStore((s) => s.appendStreamContent)
  const flushStream = useChatStore((s) => s.flushStream)

  const currentProviderData = AI_MODELS.find((m) => m.provider === selectedProvider)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleSend = async (): Promise<void> => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return

    const userMsg = { id: nextId(), role: 'user' as const, content: trimmed }
    addMessage(userMsg)
    setValue('')
    setLoading(true)

    const config = getCurrentConfig()
    const allMessages = [...messages, userMsg]

    try {
      await sendChatMessageStream(config, allMessages, {
        onChunk: (chunk) => appendStreamContent(chunk),
        onDone: () => flushStream(),
        onError: (error) => {
          flushStream()
          addMessage({
            id: nextId(),
            role: 'assistant',
            content: `Error: ${error}`
          })
          setLoading(false)
        }
      })
    } catch (err) {
      setLoading(false)
      addMessage({
        id: nextId(),
        role: 'assistant',
        content: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-surface-border bg-surface">
      <div className="max-w-[740px] mx-auto p-4">
        <div className="input-glow relative bg-surface-light border border-surface-border rounded-2xl">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            rows={1}
            className="w-full bg-transparent text-white placeholder-muted-dim text-sm px-4 pt-3 pb-2 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '160px' }}
          />

          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v12M2 8h12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-green-400" />
                  <span className="max-w-[80px] truncate">{currentProviderData?.label}</span>
                </button>

                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                    <div className="absolute bottom-full right-0 mb-1 z-20 w-48 bg-surface-light border border-surface-border rounded-xl shadow-2xl py-1">
                      {AI_MODELS.map((provider) => (
                        <div key={provider.provider}>
                          <div className="px-3 py-1 text-[10px] text-muted-dim font-medium">{provider.label}</div>
                          {provider.models.map((model) => (
                            <button
                              key={model}
                              onClick={() => {
                                setProvider(provider.provider)
                                setModel(model)
                                setShowModelMenu(false)
                              }}
                              className={`w-full text-left px-3 py-1 text-xs hover:bg-surface-lighter transition-colors
                                ${selectedProvider === provider.provider && selectedModel === model ? 'text-white' : 'text-muted'}`}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={!value.trim() || isLoading}
                className="p-1.5 text-white disabled:text-muted-dim hover:bg-surface-lighter rounded-lg transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8l12-6-4 12-3-6z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
