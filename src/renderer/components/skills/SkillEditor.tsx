import { useState, useMemo } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useSkillStore, type Skill, type SkillType } from '../../stores/skillStore'

interface Props {
  existingSkill?: Skill
  onSaved: (skillId: string) => void
  onCancel: () => void
}

function parseVariables(template: string): string[] {
  const matches = template.match(/\{\{(.+?)\}\}/g)
  if (!matches) return []
  const vars = matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim())
  return [...new Set(vars)]
}

export default function SkillEditor({ existingSkill, onSaved, onCancel }: Props): JSX.Element {
  const addSkill = useSkillStore((s) => s.addSkill)
  const updateSkill = useSkillStore((s) => s.updateSkill)

  const [name, setName] = useState(existingSkill?.name ?? '')
  const [type, setType] = useState<SkillType>(existingSkill?.type ?? 'queue')
  const [template, setTemplate] = useState(existingSkill?.template ?? '')
  const [prompts, setPrompts] = useState<string[]>(
    existingSkill?.prompts.length ? existingSkill.prompts : ['']
  )

  const detectedVariables = useMemo(() => parseVariables(template), [template])

  const handleSave = (): void => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    if (type === 'template') {
      if (!template.trim()) return
      const vars = parseVariables(template)
      if (existingSkill) {
        updateSkill(existingSkill.id, {
          name: trimmedName,
          type,
          template: template.trim(),
          prompts: [template.trim()],
          variables: vars
        })
        onSaved(existingSkill.id)
      } else {
        const id = addSkill({
          name: trimmedName,
          type,
          template: template.trim(),
          prompts: [template.trim()],
          variables: vars
        })
        onSaved(id)
      }
    } else {
      const validPrompts = prompts.map((p) => p.trim()).filter(Boolean)
      if (validPrompts.length === 0) return
      if (existingSkill) {
        updateSkill(existingSkill.id, {
          name: trimmedName,
          type,
          prompts: validPrompts,
          template: undefined,
          variables: undefined
        })
        onSaved(existingSkill.id)
      } else {
        const id = addSkill({
          name: trimmedName,
          type,
          prompts: validPrompts
        })
        onSaved(id)
      }
    }
  }

  const addPrompt = (): void => {
    setPrompts([...prompts, ''])
  }

  const updatePrompt = (index: number, value: string): void => {
    const next = [...prompts]
    next[index] = value
    setPrompts(next)
  }

  const removePrompt = (index: number): void => {
    setPrompts(prompts.filter((_, i) => i !== index))
  }

  const canSave = name.trim() && (
    (type === 'template' && template.trim()) ||
    (type === 'queue' && prompts.some((p) => p.trim()))
  )

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-lg font-medium text-white mb-6">
        {existingSkill ? '编辑技能' : '新建技能'}
      </h2>

      <div className="flex-1 space-y-5 overflow-y-auto">
        <div>
          <label className="block text-xs text-muted-dim mb-1.5">技能名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：每日新闻摘要"
            className="w-full px-3 py-2 text-sm text-white bg-surface-light border border-surface-border rounded-lg outline-none focus:border-muted transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-dim mb-1.5">类型</label>
          <div className="flex gap-2">
            <button
              onClick={() => setType('queue')}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                type === 'queue'
                  ? 'bg-surface-lighter border-white/20 text-white'
                  : 'bg-surface-light border-surface-border text-muted hover:text-white'
              }`}
            >
              提示词队列
            </button>
            <button
              onClick={() => setType('template')}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                type === 'template'
                  ? 'bg-surface-lighter border-white/20 text-white'
                  : 'bg-surface-light border-surface-border text-muted hover:text-white'
              }`}
            >
              模板变量替换
            </button>
          </div>
        </div>

        {type === 'template' && (
          <div>
            <label className="block text-xs text-muted-dim mb-1.5">
              模板内容 <span className="text-muted">（使用 {'{{变量名}}'} 定义变量）</span>
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="请分析 {{公司名}} 在 {{年份}} 的财务表现..."
              rows={6}
              className="w-full px-3 py-2 text-sm text-white bg-surface-light border border-surface-border rounded-lg outline-none focus:border-muted transition-colors resize-none"
            />
            {detectedVariables.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detectedVariables.map((v) => (
                  <span key={v} className="px-2 py-0.5 text-xs text-yellow-400 bg-yellow-500/10 rounded">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {type === 'queue' && (
          <div>
            <label className="block text-xs text-muted-dim mb-1.5">提示词列表</label>
            <div className="space-y-2">
              {prompts.map((prompt, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 w-6 h-9 flex items-center justify-center text-xs text-muted-dim">
                    {i + 1}
                  </span>
                  <textarea
                    value={prompt}
                    onChange={(e) => updatePrompt(i, e.target.value)}
                    placeholder={`提示词 ${i + 1}`}
                    rows={2}
                    className="flex-1 px-3 py-2 text-sm text-white bg-surface-light border border-surface-border rounded-lg outline-none focus:border-muted transition-colors resize-none"
                  />
                  {prompts.length > 1 && (
                    <button
                      onClick={() => removePrompt(i)}
                      className="shrink-0 p-2 text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addPrompt}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-white transition-colors"
            >
              <Plus size={14} />
              <span>添加提示词</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-muted hover:text-white transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-1.5 text-sm text-white bg-surface-lighter border border-surface-border rounded-lg hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  )
}
