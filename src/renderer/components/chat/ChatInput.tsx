import { useState, useRef, useEffect } from 'react'
import { Paperclip, X, Bot } from 'lucide-react'
import { useAppStore, AI_MODELS } from '../../stores/appStore'
import { useChatStore } from '../../stores/chatStore'
import { useConversationStore, nextMsgId } from '../../stores/conversationStore'
import { useAssistantStore } from '../../stores/assistantStore'
import { sendChatMessageStream } from '../../services/ai-client'

function formatAttachments(files: { name: string; content: string }[]): string {
  return files
    .map((f) => `[文件: ${f.name}]\n${f.content}`)
    .join('\n\n')
}

export default function ChatInput(): JSX.Element {
  const [value, setValue] = useState('')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [attachments, setAttachments] = useState<{ name: string; content: string; size: number }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedProvider = useAppStore((s) => s.selectedProvider)
  const selectedModel = useAppStore((s) => s.selectedModel)
  const setProvider = useAppStore((s) => s.setProvider)
  const setModel = useAppStore((s) => s.setModel)
  const getCurrentConfig = useAppStore((s) => s.getCurrentConfig)
  const dynamicModels = useAppStore((s) => s.dynamicModels)

  const getActiveMessages = useConversationStore((s) => s.getActiveMessages)
  const addMessage = useConversationStore((s) => s.addMessage)
  const isLoading = useChatStore((s) => s.isLoading)
  const setLoading = useChatStore((s) => s.setLoading)
  const appendStreamContent = useChatStore((s) => s.appendStreamContent)
  const flushStream = useChatStore((s) => s.flushStream)

  const activeAssistant = useAssistantStore((s) => {
    const id = s.activeAssistantId
    return s.assistants.find((a) => a.id === id) ?? null
  })
  const setActiveAssistant = useAssistantStore((s) => s.setActiveAssistant)

  const currentProviderData = AI_MODELS.find((m) => m.provider === selectedProvider)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [value])

  const handleAttach = async (): Promise<void> => {
    const files = await window.api.selectFiles()
    if (files && files.length > 0) {
      setAttachments((prev) => [...prev, ...files])
    }
  }

  const removeAttachment = (index: number): void => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = async (): Promise<void> => {
    const trimmed = value.trim()
    if ((!trimmed && attachments.length === 0) || isLoading) return

    const fullContent = attachments.length > 0
      ? formatAttachments(attachments) + (trimmed ? '\n\n' + trimmed : '')
      : trimmed

    const userMsg = { id: nextMsgId(), role: 'user' as const, content: fullContent }
    addMessage(userMsg)
    setValue('')
    setAttachments([])
    setLoading(true)

    const config = getCurrentConfig()
    const allMessages: { id: string; role: 'user' | 'assistant' | 'system'; content: string }[] = []
    if (activeAssistant) {
      allMessages.push({ id: 'system-0', role: 'system', content: activeAssistant.systemPrompt })
    }
    allMessages.push(...getActiveMessages(), userMsg)

    try {
      await sendChatMessageStream(config, allMessages, {
        onChunk: (chunk) => appendStreamContent(chunk),
        onDone: () => {
          const content = flushStream()
          if (content) {
            addMessage({ id: nextMsgId(), role: 'assistant', content })
          }
          setLoading(false)
        },
        onError: (error) => {
          flushStream()
          addMessage({
            id: nextMsgId(),
            role: 'assistant',
            content: `Error: ${error}`
          })
          setLoading(false)
        }
      })
    } catch (err) {
      setLoading(false)
      addMessage({
        id: nextMsgId(),
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
        <div className="capsule-input relative rounded-[28px]">
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

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-1">
              {attachments.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-muted bg-surface-lighter rounded-md border border-surface-border"
                >
                  <Paperclip size={10} />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-muted-dim hover:text-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {activeAssistant && (
            <div className="flex items-center gap-1.5 px-4 pb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-green-400 bg-green-500/10 rounded-md border border-green-500/20">
                <Bot size={10} />
                <span className="max-w-[140px] truncate">{activeAssistant.name}</span>
                <button
                  onClick={() => setActiveAssistant(null)}
                  className="text-green-400/60 hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={handleAttach}
                className="p-1.5 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
                title="上传附件"
              >
                <Paperclip size={14} />
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
                      {AI_MODELS.map((provider) => {
                          const models = dynamicModels[provider.provider] || provider.models
                          return (
                        <div key={provider.provider}>
                          <div className="px-3 py-1 text-[10px] text-muted-dim font-medium">{provider.label}</div>
                          {models.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setProvider(provider.provider)
                                setModel(m.id)
                                setShowModelMenu(false)
                              }}
                              className={`w-full text-left px-3 py-1 text-xs hover:bg-surface-lighter transition-colors
                                ${selectedProvider === provider.provider && selectedModel === m.id ? 'text-white' : 'text-muted'}`}
                            >
                              {m.name}
                            </button>
                          ))}
                        </div>
                          )
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={!value.trim() && attachments.length === 0}
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