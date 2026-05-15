import { useState } from 'react'
import { Plus, FolderOpen, Trash2, ArrowLeft } from 'lucide-react'
import { useKnowledgeStore } from '../../stores/knowledgeStore'
import { useAppStore } from '../../stores/appStore'
import KnowledgeSpaceDetail from './KnowledgeSpaceDetail'

export default function KnowledgeSpacesView(): JSX.Element {
  const spaces = useKnowledgeStore((s) => s.spaces)
  const docs = useKnowledgeStore((s) => s.docs)
  const addSpace = useKnowledgeStore((s) => s.addSpace)
  const deleteSpace = useKnowledgeStore((s) => s.deleteSpace)
  const setView = useAppStore((s) => s.setView)

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = (): void => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const id = addSpace(trimmed)
    setNewName('')
    setShowNewModal(false)
    setActiveSpaceId(id)
  }

  const handleDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation()
    if (activeSpaceId === id) setActiveSpaceId(null)
    deleteSpace(id)
  }

  if (activeSpaceId) {
    return (
      <KnowledgeSpaceDetail
        spaceId={activeSpaceId}
        onBack={() => setActiveSpaceId(null)}
      />
    )
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setView('home')}
          className="p-1.5 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-medium text-white">知识空间</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-surface-light border border-surface-border rounded-lg hover:bg-surface-lighter transition-colors"
        >
          <Plus size={14} />
          <span>新建空间</span>
        </button>
      </div>

      {spaces.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-dim text-sm gap-3">
          <FolderOpen size={40} className="opacity-30" />
          <p>暂无知识空间，点击右上角创建</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {spaces.map((space) => {
          const docCount = docs.filter((d) => d.spaceId === space.id).length
          return (
            <div
              key={space.id}
              onClick={() => setActiveSpaceId(space.id)}
              className="group relative p-4 bg-surface-light border border-surface-border rounded-xl hover:border-muted transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <FolderOpen size={20} className="text-blue-400 shrink-0" />
                <button
                  onClick={(e) => handleDelete(e, space.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-dim hover:text-red-400 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="text-sm font-medium text-white truncate mb-1">{space.name}</h3>
              <p className="text-xs text-muted-dim">{docCount} 个文档</p>
              <p className="text-xs text-muted-dim mt-1">
                {new Date(space.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          )
        })}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowNewModal(false)} />
          <div className="relative w-full max-w-sm mx-4 bg-surface-light border border-surface-border rounded-2xl shadow-2xl p-5">
            <h2 className="text-sm font-medium text-white mb-4">新建知识空间</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="空间名称"
              className="w-full px-3 py-2 text-sm text-white bg-surface border border-surface-border rounded-lg outline-none focus:border-muted transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-1.5 text-sm text-muted hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-1.5 text-sm text-white bg-surface-lighter border border-surface-border rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
