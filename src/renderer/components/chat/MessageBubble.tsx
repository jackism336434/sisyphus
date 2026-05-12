import ReactMarkdown from 'react-markdown'
import { type ChatMessage } from '../../stores/conversationStore'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: Props): JSX.Element {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[75%]">
          <div className="bg-[#171717] text-white rounded-[28px] px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  // AI message - document flow, no background
  return (
    <div className="flex gap-3 mb-6 max-w-[85%]">
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M24 4 C16 12, 8 20, 24 36 C40 20, 32 12, 24 4Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <circle cx="24" cy="24" r="4" fill="white" opacity="0.4" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-dim mb-1.5">Sisyphus</div>
        <div className="text-sm text-white leading-relaxed break-words">
          <ReactMarkdown>{message.content}</ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-white ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  )
}
