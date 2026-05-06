import { ChatMessage } from '../../stores/chatStore'

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
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 flex items-center justify-center text-[10px] text-white font-medium shrink-0">
              S
            </div>
          )}
          <span className="text-xs text-muted-dim">{isUser ? 'You' : 'Sisyphus'}</span>
        </div>

        {/* Content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isUser
              ? 'bg-white text-black rounded-br-md'
              : 'bg-surface-light text-white border border-surface-border rounded-bl-md'
            }
            ${isStreaming ? 'animate-pulse' : ''}`}
        >
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-white ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  )
}
