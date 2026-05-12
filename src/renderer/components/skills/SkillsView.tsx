import { useState } from 'react'
import { Plus, Zap, X, ArrowLeft } from 'lucide-react'
import { useSkillStore, type Skill } from '../../stores/skillStore'
import { useAppStore } from '../../stores/appStore'
import SkillEditor from './SkillEditor'
import SkillRunner from './SkillRunner'

type RightPanel = null | { mode: 'new' } | { mode: 'edit'; skill: Skill } | { mode: 'run'; skill: Skill }

export default function SkillsView(): JSX.Element {
  const skills = useSkillStore((s) => s.skills)
  const activeSkillId = useSkillStore((s) => s.activeSkillId)
  const setActive = useSkillStore((s) => s.setActive)
  const deleteSkill = useSkillStore((s) => s.deleteSkill)
  const setView = useAppStore((s) => s.setView)

  const [panel, setPanel] = useState<RightPanel>(null)

  const handleSelectSkill = (skill: Skill): void => {
    setActive(skill.id)
    setPanel({ mode: 'run', skill })
  }

  const handleNew = (): void => {
    setPanel({ mode: 'new' })
  }

  const handleEdit = (skill: Skill): void => {
    setPanel({ mode: 'edit', skill })
  }

  const handleSaved = (skillId: string): void => {
    setActive(skillId)
    const skill = useSkillStore.getState().skills.find((s) => s.id === skillId)
    if (skill) setPanel({ mode: 'run', skill })
  }

  const handleCancel = (): void => {
    if (activeSkillId) {
      const skill = useSkillStore.getState().skills.find((s) => s.id === activeSkillId)
      if (skill) setPanel({ mode: 'run', skill })
      else setPanel(null)
    } else {
      setPanel(null)
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string): void => {
    e.stopPropagation()
    deleteSkill(id)
    if (panel && 'skill' in panel && panel.skill.id === id) {
      setPanel(null)
    }
  }

  return (
    <div className="h-full flex">
      {/* Left panel — skill list */}
      <div className="w-[280px] border-r border-surface-border flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => setView('home')}
            className="p-1.5 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-medium text-white">工作流</h1>
          <button
            onClick={handleNew}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-surface-light border border-surface-border rounded-lg hover:bg-surface-lighter transition-colors"
          >
            <Plus size={14} />
            <span>新建</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {skills.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-dim">暂无工作流</p>
          )}
          {skills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => handleSelectSkill(skill)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                skill.id === activeSkillId
                  ? 'bg-surface-light text-white'
                  : 'text-muted hover:text-white hover:bg-surface-light'
              }`}
            >
              <Zap size={16} className="shrink-0 text-yellow-500" />
              <span className="flex-1 text-left truncate">{skill.name}</span>
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] text-muted-dim bg-surface rounded">
                {skill.type === 'template' ? '模板' : '队列'}
              </span>
              <button
                onClick={(e) => handleDelete(e, skill.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-dim hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — detail/edit/run */}
      <div className="flex-1 overflow-y-auto">
          {!panel && (
          <div className="h-full flex items-center justify-center text-muted-dim text-sm">
            选择一个工作流或创建工作流
          </div>
        )}
        {panel?.mode === 'new' && (
          <SkillEditor onSaved={handleSaved} onCancel={handleCancel} />
        )}
        {panel?.mode === 'edit' && (
          <SkillEditor existingSkill={panel.skill} onSaved={handleSaved} onCancel={handleCancel} />
        )}
        {panel?.mode === 'run' && (
          <SkillRunner skill={panel.skill} onEdit={() => handleEdit(panel.skill)} />
        )}
      </div>
    </div>
  )
}
