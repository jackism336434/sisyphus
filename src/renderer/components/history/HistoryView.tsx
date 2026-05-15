import { useState } from 'react'
import { Search, X, MessageSquare } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useConversationStore } from '../../stores/conversationStore'

export default function HistoryView(): JSX.Element {
  const setView = useAppStore((s) => s.setView)
  const setActive = useConversationStore((s) => s.setActive)
  const conversations = useConversationStore((s) => s.conversations)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)
  const [search, setSearch] = useState('')

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpen = (id: string) => {
    setActive(id)
    setView('chat')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-white mb-6">历史对话</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dim" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索历史对话..."
          className="input-glow w-full pl-10 pr-4 py-2.5 bg-surface-light border border-surface-border rounded-lg text-sm text-white placeholder-muted-dim focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-dim">
          <MessageSquare size={48} className="mb-4 opacity-30" />
          <p className="text-sm">{search ? '没有找到匹配的对话' : '暂无历史对话'}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
              onClick={() => handleOpen(conv.id)}
            >
              <MessageSquare size={16} className="text-muted shrink-0" />
              <span className="flex-1 text-sm text-white truncate">{conv.title}</span>
              <span className="text-xs text-muted-dim shrink-0">
                {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-dim hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
