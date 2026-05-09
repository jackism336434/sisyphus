import ReactMarkdown from 'react-markdown'
import { type ChatMessage } from '../../stores/conversationStore'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming }: Props): JSX.Element {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? 'order-1' : 'order-1'}`}>
        {/* Avatar + Role */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="shrink-0">
              <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.5" fill="none" opacity="0.7" />
              <path d="M24 4 C16 12, 8 20, 24 36 C40 20, 32 12, 24 4Z" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <circle cx="24" cy="24" r="4" fill="white" opacity="0.6" />
            </svg>
          )}
          <span className="text-xs text-muted-dim">{isUser ? 'You' : 'Sisyphus'}</span>
        </div>

        {/* Content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words
            ${isUser
              ? 'bg-white text-black rounded-br-md whitespace-pre-wrap'
              : 'bg-surface-light text-white border border-surface-border rounded-bl-md'
            }
            ${isStreaming ? 'animate-pulse' : ''}`}
        >
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-white ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  )
}
