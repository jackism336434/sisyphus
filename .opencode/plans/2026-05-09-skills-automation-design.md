# Skills Automation Feature Design

## Overview

Add functional "技能" (Skills) button to the sidebar that opens a new Skills view. Users can create reusable "skills" — automated conversation templates that send prompts to AI sequentially and write responses in real-time to a markdown file.

## Two Skill Types

1. **Template Variable Replacement** — User writes a template with `{{变量名}}` placeholders. At runtime, fills in variables, sends the rendered prompt to AI, writes the response to .md.
2. **Preset Prompt Queue** — User defines a list of prompts. At runtime, sends each prompt sequentially, appends each response to the same .md file.

## Data Model

**File**: `src/renderer/stores/skillStore.ts`

```ts
export type SkillType = 'template' | 'queue'

export interface Skill {
  id: string
  name: string
  type: SkillType
  template?: string        // Template content with {{variable}} placeholders
  prompts: string[]        // Queue mode: list of prompts; Template mode: single parsed prompt
  variables?: string[]     // Template mode: auto-parsed variable names
  createdAt: number
  updatedAt: number
}
```

Store: Zustand + persist, localStorage key `'sisyphus-skills'`. Same pattern as `assistantStore`.

Actions:
- `addSkill(skill)` — create new skill, auto-generate id/timestamps
- `updateSkill(id, updates)` — partial update
- `deleteSkill(id)` — remove skill
- `setActive(id)` — set active skill for detail view

## IPC Channels

Two new IPC channels for file operations:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `file:saveDialog` | renderer→main | Open native "Save As" dialog, return selected file path |
| `file:writeChunk` | renderer→main | Append text content to a file at the given path |

### Preload Bridge

Add to `window.api` in `src/preload/index.ts`:
- `saveFileDialog(defaultName: string)` → `Promise<string | null>`
- `writeFileChunk(filePath: string, content: string)` → `Promise<void>`

### Main Process Handlers

In `src/main/index.ts`:

**`file:saveDialog`**:
1. Use `dialog.showSaveDialog()` with filters `[{ name: 'Markdown', extensions: ['md'] }]`
2. Return the selected file path or `null` if cancelled

**`file:writeChunk`**:
1. Use `fs.appendFile()` to write content to the given path
2. Return void

## View Routing

**`src/renderer/stores/appStore.ts`**: Extend `View` type:
```ts
export type View = 'home' | 'chat' | 'settings' | 'account' | 'custom' | 'skills'
```

**`src/renderer/components/layout/AppLayout.tsx`**: Add conditional render:
```tsx
{currentView === 'skills' && <SkillsView />}
```

**`src/renderer/components/layout/Sidebar.tsx`**: Wire skills button:
```ts
onClick={() => {
  if (item.id === 'custom') setView('custom')
  if (item.id === 'skills') setView('skills')
}}
```

## UI Components

### SkillsView (`src/renderer/components/skills/SkillsView.tsx`)

Main view component. Layout: left list (30%) + right detail/edit area (70%).

**Left panel**:
- Top: `+ 新建技能` button
- List of saved skills showing name + type badge (模板/队列)
- Selected item highlighted; hover reveals delete X button (group/opacity pattern from sidebar)

**Right panel** (state-dependent):
- **No selection**: Empty state placeholder
- **Edit mode** (new or edit): SkillEditor component
- **Run mode** (existing skill selected): SkillRunner component

### SkillEditor (`src/renderer/components/skills/SkillEditor.tsx`)

Form for creating/editing a skill:
- Name input field
- Type selector (two radio-style buttons: 模板变量替换 / 提示词队列)
- **Template mode**: Large textarea for template content. Auto-detects `{{变量名}}` and renders variable input fields below. Shows preview of rendered prompt.
- **Queue mode**: Dynamic list of prompt textareas. Each row has a delete button. "添加提示词" button at bottom.
- Save / Cancel buttons

### SkillRunner (`src/renderer/components/skills/SkillRunner.tsx`)

Displays a selected skill ready to run:
- Skill name and type
- **Template mode**: Shows variable input form (one input per detected variable)
- **Queue mode**: Shows numbered list of prompts (read-only)
- "运行" button
- Running state: progress bar (e.g., "3/5 已完成"), current prompt highlight, cancel button

## Run Engine

Implemented inside SkillRunner component:

```
1. User clicks "运行"
2. Call window.api.saveFileDialog(`${skill.name}_${YYYY-MM-DD}.md`)
3. If cancelled, abort
4. Write MD header: `# ${skill.name}\n\n${日期}\n\n---\n` via writeFileChunk
5. For each prompt in skill.prompts:
   a. For template mode: replace {{变量名}} with user input values
   b. Create conversation via conversationStore.createConversation(prompt)
   c. Add user message via conversationStore.addMessage
   d. Call sendChatMessageStream(config, messages, callbacks)
   e. Wait for onDone, get full response from chatStore.flushStream()
   f. Append to MD: `## ${prompt}\n\n${response}\n\n---\n` via writeFileChunk
   g. Update progress counter
6. Show completion notification (e.g., toast or inline message)
```

The run engine uses the existing `sendChatMessageStream` from `ai-client.ts` and the current AI config from `appStore.getCurrentConfig()`.

## Files to Modify

| File | Change |
|------|--------|
| `src/renderer/stores/appStore.ts` | Add `'skills'` to View type |
| `src/renderer/stores/skillStore.ts` | **New file** — skill store |
| `src/renderer/components/layout/Sidebar.tsx` | Wire skills button onClick |
| `src/renderer/components/layout/AppLayout.tsx` | Add SkillsView conditional render |
| `src/renderer/components/skills/SkillsView.tsx` | **New file** — main view |
| `src/renderer/components/skills/SkillEditor.tsx` | **New file** — editor form |
| `src/renderer/components/skills/SkillRunner.tsx` | **New file** — runner with progress |
| `src/main/index.ts` | Add file:saveDialog and file:writeChunk IPC handlers |
| `src/preload/index.ts` | Expose saveFileDialog and writeFileChunk |
| `src/preload/index.d.ts` | Type declarations for new API methods |

## Conventions

- All UI text in Chinese (简体中文)
- Dark theme only, use existing Tailwind classes (surface, muted, input-glow, glass-panel)
- Icons: lucide-react
- No code comments unless requested
- Follow existing patterns from assistantStore/CustomAssistantsView
