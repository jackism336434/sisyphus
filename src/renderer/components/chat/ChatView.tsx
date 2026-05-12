import { useEffect, useRef } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useConversationStore } from '../../stores/conversationStore'
import { useAppStore } from '../../stores/appStore'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'

export default function ChatView(): JSX.Element {
  const messages = useConversationStore((s) => s.getActiveMessages())
  const isLoading = useChatStore((s) => s.isLoading)
  const streamContent = useChatStore((s) => s.streamContent)
  const setView = useAppStore((s) => s.setView)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-surface-border shrink-0">
        <button
          onClick={() => setView('home')}
          className="text-muted hover:text-white transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">返回</span>
        </button>
        <span className="text-sm text-muted-dim">对话</span>
        <div className="w-16" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[740px] mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="text-4xl mb-4 opacity-20">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                  <circle cx="24" cy="24" r="22" fill="none" />
                  <path d="M24 4 C16 12, 8 20, 24 36 C40 20, 32 12, 24 4Z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="24" r="5" fill="currentColor" />
                </svg>
              </div>
              <p className="text-muted-dim text-sm">开始与 Sisyphus 对话</p>
              <p className="text-muted-dim text-xs mt-1">选择模型后发送你的第一个问题</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Streaming indicator */}
          {isLoading && streamContent && (
            <MessageBubble
              message={{ id: 'streaming', role: 'assistant', content: streamContent }}
              isStreaming
            />
          )}

          {/* Loading indicator (no content yet) */}
          {isLoading && !streamContent && (
            <div className="flex gap-3 mb-6 max-w-[85%]">
              <div className="shrink-0 pt-0.5">
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <path d="M24 4 C16 12, 8 20, 24 36 C40 20, 32 12, 24 4Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <circle cx="24" cy="24" r="4" fill="white" opacity="0.4" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-muted-dim mb-1.5">Sisyphus</div>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-dim rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-dim rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-dim rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput />
    </div>
  )
}
