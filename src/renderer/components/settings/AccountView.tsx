import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { useConversationStore } from '../../stores/conversationStore'

function EditableRow({
  label,
  value,
  placeholder,
  onSave
}: {
  label: string
  value: string
  placeholder: string
  onSave: (v: string) => void
}): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleSave = () => {
    onSave(draft.trim())
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <>
      <div className="flex items-center justify-between py-3.5">
        <span className="text-sm text-white">{label}</span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-40 bg-surface-light border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-muted-dim outline-none focus:border-white/30 transition-colors"
            />
            <button
              onClick={handleSave}
              className="px-2.5 py-1 text-xs bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              保存
            </button>
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 text-xs text-muted hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-dim">{value || '未设置'}</span>
            <button
              onClick={() => {
                setDraft(value)
                setEditing(true)
              }}
              className="px-3 py-1.5 text-xs bg-surface-light border border-white/10 rounded-lg text-muted hover:text-white hover:border-white/20 transition-colors"
            >
              设置
            </button>
          </div>
        )}
      </div>
      <hr className="border-white/5" />
    </>
  )
}

export default function AccountView(): JSX.Element {
  const setView = useAppStore((s) => s.setView)
  const { avatarUrl, setAvatar, displayName, setDisplayName, username, setUsername, email, setEmail, resetAccount } = useAppStore()
  const clearConversations = useConversationStore((s) => s.clearAll)

  const handleChangeAvatar = async () => {
    const dataUrl = await window.api.selectAvatar()
    if (dataUrl) setAvatar(dataUrl)
  }

  return (
    <div className="flex flex-col h-full max-w-[640px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => setView('home')}
          className="text-muted hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg font-medium text-white">账户</h2>
      </div>

      {/* Avatar */}
      <div className="flex items-center justify-between py-3.5">
        <span className="text-sm text-white">头像</span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-light overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-dim">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            )}
          </div>
          <button
            onClick={handleChangeAvatar}
            className="px-3 py-1.5 text-xs bg-surface-light border border-white/10 rounded-lg text-muted hover:text-white hover:border-white/20 transition-colors"
          >
            更改头像
          </button>
        </div>
      </div>
      <hr className="border-white/5" />

      {/* Profile Fields */}
      <EditableRow label="全名" value={displayName} placeholder="输入全名" onSave={setDisplayName} />
      <EditableRow label="用户名" value={username} placeholder="输入用户名" onSave={setUsername} />
      <EditableRow label="电子邮件" value={email} placeholder="输入邮箱" onSave={setEmail} />

      {/* Subscription */}
      <div className="mt-10 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-white mb-4">您的订阅</h3>
        <div className="flex items-center justify-between bg-surface-light rounded-xl px-5 py-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              Pro
            </div>
            <div>
              <span className="text-sm text-white font-medium">Pro</span>
              <p className="text-xs text-muted-dim mt-0.5">无限次对话 · 优先支持</p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors">
            升级计划
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="mt-10 pt-6 border-t border-white/10">
        <h3 className="text-sm font-medium text-white mb-4">安全</h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              if (confirm('确定要退出所有会话吗？')) {
                clearConversations()
              }
            }}
            className="w-full text-left px-4 py-3 text-sm text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            退出所有会话
          </button>
          <button
            onClick={() => {
              if (confirm('确定要删除账户吗？此操作不可撤销。')) {
                resetAccount()
                clearConversations()
              }
            }}
            className="w-full text-left px-4 py-3 text-sm text-red-400/80 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            删除账户
          </button>
        </div>
      </div>
    </div>
  )
}
