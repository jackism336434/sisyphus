# Skills Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a functional "技能" (Skills) sidebar button that opens a view where users can create automated conversation templates (variable replacement or prompt queues) and run them, with responses written in real-time to a markdown file.

**Architecture:** New `skillStore` (Zustand + persist) for skill data. New `SkillsView` with list+detail layout. Two new IPC channels (`file:saveDialog`, `file:writeChunk`) for file operations. Run engine inside `SkillRunner` component uses existing `sendChatMessageStream`.

**Tech Stack:** React 18, TypeScript, Zustand, TailwindCSS, Electron 30 IPC

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/main/index.ts` | Modify | Add `file:saveDialog` and `file:writeChunk` IPC handlers |
| `src/preload/index.ts` | Modify | Expose `saveFileDialog` and `writeFileChunk` on `window.api` |
| `src/preload/index.d.ts` | Modify | Type declarations for new API methods |
| `src/renderer/stores/skillStore.ts` | Create | Skill data model + Zustand persist store |
| `src/renderer/stores/appStore.ts` | Modify | Add `'skills'` to View type |
| `src/renderer/components/layout/Sidebar.tsx` | Modify | Wire skills button to `setView('skills')` |
| `src/renderer/components/layout/AppLayout.tsx` | Modify | Add SkillsView conditional render |
| `src/renderer/components/skills/SkillsView.tsx` | Create | Main view: left list + right detail panel |
| `src/renderer/components/skills/SkillEditor.tsx` | Create | Create/edit form for skills |
| `src/renderer/components/skills/SkillRunner.tsx` | Create | Run interface with progress + MD export |

---

### Task 1: IPC Layer — File Save Dialog + File Write

**Files:**
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/preload/index.d.ts`

- [ ] **Step 1: Add IPC handlers to main process**

In `src/main/index.ts`, add `appendFile` import and two new IPC handlers after the `select-avatar` handler (after line 98):

```ts
import { readFileSync, appendFile } from 'fs'
```

Add inside the `app.whenReady().then(() => { ... })` block, after the `select-avatar` handler:

```ts
  ipcMain.handle('file:saveDialog', async (_event, defaultName: string) => {
    if (!mainWindow) return null
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || !result.filePath) return null
    return result.filePath
  })

  ipcMain.handle('file:writeChunk', async (_event, filePath: string, content: string) => {
    return new Promise<void>((resolve, reject) => {
      appendFile(filePath, content, 'utf-8', (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
```

- [ ] **Step 2: Add preload bridge methods**

In `src/preload/index.ts`, add two methods to the `api` object (after line 14):

```ts
const api = {
  selectAvatar: () => ipcRenderer.invoke('select-avatar') as Promise<string | null>,
  selectFiles: () => ipcRenderer.invoke('select-files') as Promise<AttachedFile[]>,
  listModels: (baseURL: string, apiKey: string) =>
    ipcRenderer.invoke('ai:listModels', baseURL, apiKey) as Promise<{ name: string; id: string }[]>,
  saveFileDialog: (defaultName: string) =>
    ipcRenderer.invoke('file:saveDialog', defaultName) as Promise<string | null>,
  writeFileChunk: (filePath: string, content: string) =>
    ipcRenderer.invoke('file:writeChunk', filePath, content) as Promise<void>
}
```

- [ ] **Step 3: Add type declarations**

In `src/preload/index.d.ts`, add the two new methods to the `Window.api` type (after line 15):

```ts
    api: {
      selectAvatar: () => Promise<string | null>
      selectFiles: () => Promise<AttachedFile[]>
      listModels: (baseURL: string, apiKey: string) => Promise<{ name: string; id: string }[]>
      saveFileDialog: (defaultName: string) => Promise<string | null>
      writeFileChunk: (filePath: string, content: string) => Promise<void>
    }
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

---

### Task 2: Skill Store

**Files:**
- Create: `src/renderer/stores/skillStore.ts`

- [ ] **Step 1: Create skillStore.ts**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SkillType = 'template' | 'queue'

export interface Skill {
  id: string
  name: string
  type: SkillType
  template?: string
  prompts: string[]
  variables?: string[]
  createdAt: number
  updatedAt: number
}

interface SkillState {
  skills: Skill[]
  activeSkillId: string | null

  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateSkill: (id: string, updates: Partial<Skill>) => void
  deleteSkill: (id: string) => void
  setActive: (id: string | null) => void
  getActive: () => Skill | null
}

let idCounter = 0
const nextId = () => `skill-${Date.now()}-${++idCounter}`

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: [],
      activeSkillId: null,

      addSkill: (skill) => {
        const now = Date.now()
        const newSkill: Skill = {
          ...skill,
          id: nextId(),
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          skills: [...state.skills, newSkill]
        }))
        return newSkill.id
      },

      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }))
      },

      deleteSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
          activeSkillId: state.activeSkillId === id ? null : state.activeSkillId
        }))
      },

      setActive: (id) => {
        set({ activeSkillId: id })
      },

      getActive: () => {
        const { skills, activeSkillId } = get()
        return skills.find((s) => s.id === activeSkillId) ?? null
      }
    }),
    {
      name: 'sisyphus-skills',
      partialize: (state) => ({
        skills: state.skills,
        activeSkillId: state.activeSkillId
      })
    }
  )
)
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

---

### Task 3: View Routing

**Files:**
- Modify: `src/renderer/stores/appStore.ts:4`
- Modify: `src/renderer/components/layout/Sidebar.tsx:55-57`
- Modify: `src/renderer/components/layout/AppLayout.tsx`

- [ ] **Step 1: Add 'skills' to View type**

In `src/renderer/stores/appStore.ts`, line 4:

```ts
export type View = 'home' | 'chat' | 'settings' | 'account' | 'custom' | 'skills'
```

- [ ] **Step 2: Wire sidebar skills button**

In `src/renderer/components/layout/Sidebar.tsx`, replace the onClick handler (lines 55-57):

```ts
            onClick={() => {
              if (item.id === 'custom') setView('custom')
              if (item.id === 'skills') setView('skills')
            }}
```

- [ ] **Step 3: Add SkillsView to AppLayout**

In `src/renderer/components/layout/AppLayout.tsx`, add import and conditional render:

Add import after line 7:
```ts
import SkillsView from '../skills/SkillsView'
```

Add after line 23 (after the custom view line):
```tsx
          {currentView === 'skills' && <SkillsView />}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: No errors (SkillsView import will fail until Task 4 is done, that's expected)

---

### Task 4: SkillsView — Main Layout

**Files:**
- Create: `src/renderer/components/skills/SkillsView.tsx`

- [ ] **Step 1: Create SkillsView.tsx**

```tsx
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
          <h1 className="text-lg font-medium text-white">技能</h1>
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
            <p className="px-3 py-8 text-center text-sm text-muted-dim">暂无技能</p>
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
            选择一个技能或创建新技能
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
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: Errors for missing SkillEditor and SkillRunner imports (created in next tasks)

---

### Task 5: SkillEditor — Create/Edit Form

**Files:**
- Create: `src/renderer/components/skills/SkillEditor.tsx`

- [ ] **Step 1: Create SkillEditor.tsx**

```tsx
import { useState, useEffect, useMemo } from 'react'
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

  useEffect(() => {
    if (type === 'template' && existingSkill?.variables) {
      // keep existing variables
    }
  }, [type, existingSkill])

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
        {/* Name */}
        <div>
          <label className="block text-xs text-muted-dim mb-1.5">技能名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：每日新闻摘要"
            className="w-full px-3 py-2 text-sm text-white bg-surface-light border border-surface-border rounded-lg outline-none focus:border-muted transition-colors"
          />
        </div>

        {/* Type selector */}
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

        {/* Template mode */}
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

        {/* Queue mode */}
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

      {/* Actions */}
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
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

---

### Task 6: SkillRunner — Run Interface with Progress

**Files:**
- Create: `src/renderer/components/skills/SkillRunner.tsx`

- [ ] **Step 1: Create SkillRunner.tsx**

```tsx
import { useState, useRef } from 'react'
import { Pencil, Play, Square, CheckCircle } from 'lucide-react'
import { useSkillStore, type Skill } from '../../stores/skillStore'
import { useConversationStore, nextMsgId } from '../../stores/conversationStore'
import { useChatStore } from '../../stores/chatStore'
import { useAppStore } from '../../stores/appStore'
import { sendChatMessageStream } from '../../services/ai-client'

interface Props {
  skill: Skill
  onEdit: () => void
}

type RunState = null | { status: 'running'; current: number; total: number } | { status: 'done'; total: number } | { status: 'error'; message: string }

export default function SkillRunner({ skill, onEdit }: Props): JSX.Element {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [runState, setRunState] = useState<RunState>(null)
  const cancelledRef = useRef(false)

  const handleRun = async (): Promise<void> => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const defaultName = `${skill.name}_${dateStr}.md`

    const filePath = await window.api.saveFileDialog(defaultName)
    if (!filePath) return

    let promptsToRun: string[] = []

    if (skill.type === 'template' && skill.template) {
      let rendered = skill.template
      for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      }
      promptsToRun = [rendered]
    } else {
      promptsToRun = skill.prompts
    }

    const total = promptsToRun.length
    cancelledRef.current = false

    const header = `# ${skill.name}\n\n${dateStr}\n\n---\n\n`
    await window.api.writeFileChunk(filePath, header)

    setRunState({ status: 'running', current: 0, total })

    const config = useAppStore.getState().getCurrentConfig()

    for (let i = 0; i < total; i++) {
      if (cancelledRef.current) break

      const prompt = promptsToRun[i]
      setRunState({ status: 'running', current: i + 1, total })

      const convId = useConversationStore.getState().createConversation(`[技能] ${skill.name} - ${i + 1}/${total}`)
      useConversationStore.getState().addMessage({
        id: nextMsgId(),
        role: 'user',
        content: prompt
      })

      const response = await new Promise<string>((resolve, reject) => {
        useChatStore.getState().setLoading(true)

        sendChatMessageStream(config, [
          { id: nextMsgId(), role: 'user', content: prompt }
        ], {
          onChunk: (chunk) => {
            useChatStore.getState().appendStreamContent(chunk)
          },
          onDone: () => {
            const content = useChatStore.getState().flushStream()
            useConversationStore.getState().addMessage({
              id: nextMsgId(),
              role: 'assistant',
              content
            })
            resolve(content)
          },
          onError: (error) => {
            useChatStore.getState().setLoading(false)
            reject(new Error(error))
          }
        })
      }).catch((err) => {
        setRunState({ status: 'error', message: err.message })
        return null
      })

      if (response === null) return

      const section = `## ${prompt}\n\n${response}\n\n---\n\n`
      await window.api.writeFileChunk(filePath, section)
    }

    if (!cancelledRef.current) {
      setRunState({ status: 'done', total })
    }
  }

  const handleCancel = (): void => {
    cancelledRef.current = true
    setRunState(null)
  }

  const isRunning = runState?.status === 'running'

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-medium text-white flex-1">{skill.name}</h2>
        <button
          onClick={onEdit}
          className="p-2 text-muted hover:text-white hover:bg-surface-lighter rounded-lg transition-colors"
          title="编辑"
        >
          <Pencil size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-0.5 text-xs text-yellow-400 bg-yellow-500/10 rounded">
          {skill.type === 'template' ? '模板变量替换' : '提示词队列'}
        </span>
        <span className="text-xs text-muted-dim">
          {skill.type === 'template' ? `${skill.variables?.length ?? 0} 个变量` : `${skill.prompts.length} 条提示词`}
        </span>
      </div>

      {/* Template variable inputs */}
      {skill.type === 'template' && skill.variables && skill.variables.length > 0 && !isRunning && runState?.status !== 'done' && (
        <div className="mb-6 space-y-3">
          <label className="block text-xs text-muted-dim">填写变量</label>
          {skill.variables.map((v) => (
            <div key={v}>
              <label className="block text-xs text-muted mb-1">{`{{${v}}}`}</label>
              <input
                value={variables[v] ?? ''}
                onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                placeholder={v}
                className="w-full px-3 py-2 text-sm text-white bg-surface-light border border-surface-border rounded-lg outline-none focus:border-muted transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* Queue prompt list */}
      {skill.type === 'queue' && !isRunning && runState?.status !== 'done' && (
        <div className="mb-6 space-y-2">
          <label className="block text-xs text-muted-dim mb-2">提示词列表</label>
          {skill.prompts.map((p, i) => (
            <div key={i} className="flex gap-2 px-3 py-2 bg-surface-light border border-surface-border rounded-lg">
              <span className="shrink-0 text-xs text-muted-dim">{i + 1}.</span>
              <span className="text-sm text-muted line-clamp-2">{p}</span>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {runState && (
        <div className="mb-6">
          {runState.status === 'running' && (
            <div>
              <div className="flex items-center justify-between text-sm text-muted mb-2">
                <span>正在处理 {runState.current}/{runState.total}</span>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Square size={12} />
                  取消
                </button>
              </div>
              <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/30 rounded-full transition-all duration-300"
                  style={{ width: `${(runState.current / runState.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          {runState.status === 'done' && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle size={16} />
              <span>完成！共处理 {runState.total} 条</span>
            </div>
          )}
          {runState.status === 'error' && (
            <div className="text-sm text-red-400">
              错误：{runState.message}
            </div>
          )}
        </div>
      )}

      {/* Run button */}
      {!isRunning && runState?.status !== 'done' && (
        <button
          onClick={handleRun}
          disabled={skill.type === 'template' && skill.variables?.some((v) => !variables[v]?.trim())}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-white bg-surface-lighter border border-surface-border rounded-xl hover:bg-surface-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={16} />
          <span>运行</span>
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

---

### Task 7: Final Verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Start dev server and test**

Run: `npm run dev`
Expected: App launches, sidebar "技能" button navigates to SkillsView, can create/edit/delete skills, can run a skill with MD export

---

## Summary

| Task | Files | Est. Time |
|------|-------|-----------|
| 1. IPC Layer | 3 modified | 5 min |
| 2. SkillStore | 1 created | 5 min |
| 3. View Routing | 3 modified | 3 min |
| 4. SkillsView | 1 created | 10 min |
| 5. SkillEditor | 1 created | 15 min |
| 6. SkillRunner | 1 created | 15 min |
| 7. Verification | — | 5 min |
