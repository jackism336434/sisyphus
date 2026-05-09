import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, ArrowLeft } from 'lucide-react'
import { useAssistantStore, type CustomAssistant } from '../../stores/assistantStore'
import { useAppStore } from '../../stores/appStore'

type ModalState = null | { mode: 'new' } | { mode: 'edit'; assistant: CustomAssistant }

export default function CustomAssistantsView(): JSX.Element {
  const assistants = useAssistantStore((s) => s.assistants)
  const activeAssistantId = useAssistantStore((s) => s.activeAssistantId)
  const setActiveAssistant = useAssistantStore((s) => s.setActiveAssistant)
  const addAssistant = useAssistantStore((s) => s.addAssistant)
  const updateAssistant = useAssistantStore((s) => s.updateAssistant)
  const deleteAssistant = useAssistantStore((s) => s.deleteAssistant)
  const setView = useAppStore((s) => s.setView)

  const [modal, setModal] = useState<ModalState>(null)
  const [name, setName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')

  const openNew = (): void => {
    setName('')
    setSystemPrompt('')
    setModal({ mode: 'new' })
  }

  const openEdit = (assistant: CustomAssistant): void => {
    setName(assistant.name)
    setSystemPrompt(assistant.systemPrompt)
    setModal({ mode: 'edit', assistant })
  }

  const handleSave = (): void => {
    const trimmedName = name.trim()
    const trimmedPrompt = systemPrompt.trim()
    if (!trimmedName || !trimmedPrompt) return

    if (modal?.mode === 'new') {
      addAssistant(trimmedName, trimmedPrompt)
    } else if (modal?.mode === 'edit') {
      updateAssistant(modal.assistant.id, { name: trimmedName, systemPrompt: trimmedPrompt })
    }
    setModal(null)
  }

  const handleDelete = (id: string): void => {
    deleteAssistant(id)
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
        <h1 className="text-lg font-medium text-white">自定义助手</h1>
        <button
          onClick={openNew}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-surface-light border border-surface-border rounded-lg hover:bg-surface-lighter transition-colors"
        >
          <Plus size={14} />
          <span>新建助手</span>
        </button>
      </div>

      {assistants.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-dim text-sm">
          暂无自定义助手，点击右上角创建
        </div>
      )}

      <div className="space-y-3">
        {assistants.map((a) => (
          <div
            key={a.id}
            className={`p-4 bg-surface-light border rounded-xl transition-colors ${
              a.id === activeAssistantId ? 'border-green-500/50' : 'border-surface-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">{a.name}</span>
                  {a.id === activeAssistantId && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium text-green-400 bg-green-500/10 rounded">
                      当前使用
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-dim line-clamp-2 leading-relaxed">{a.systemPrompt}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {a.id !== activeAssistantId && (
                  <button
                    onClick={() => setActiveAssistant(a.id)}
                    className="p-1.5 text-muted hover:text-green-400 hover:bg-surface-lighter rounded-lg transition-colors"
                    title="激活"
                  >
                    <Check size={14} />
                  </button>
                )}
                {a.id === activeAssistantId && (
                  <button
                    onClick={() => setActiveAssistant(null)}
                    className="p-1.5 text-green-400 hover:text-muted hover:bg-surface-lighter rounded-lg transition-colors"
                    title="取消激活"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
                  title="编辑"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-muted hover:text-red-400 hover:bg-surface-lighter rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-lg mx-4 bg-surface-light border border-surface-border rounded-2xl shadow-2xl p-5">
            <h2 className="text-sm font-medium text-white mb-4">
              {modal.mode === 'new' ? '新建助手' : '编辑助手'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-dim mb-1">助手名称</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：代码审查专家"
                  className="w-full px-3 py-2 text-sm text-white bg-surface border border-surface-border rounded-lg outline-none focus:border-muted transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-dim mb-1">系统提示词</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="描述助手的角色和行为..."
                  rows={8}
                  className="w-full px-3 py-2 text-sm text-white bg-surface border border-surface-border rounded-lg outline-none focus:border-muted transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-1.5 text-sm text-muted hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || !systemPrompt.trim()}
                className="px-4 py-1.5 text-sm text-white bg-surface-lighter border border-surface-border rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}