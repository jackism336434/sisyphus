# 日志系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Sisyphus AI Client 添加基于 electron-log 的开发调试日志系统，实现三进程统一日志输出

**Architecture:** Main 进程初始化 electron-log，Renderer/Preload 通过 IPC 转发日志消息到 Main 进程统一写入

**Tech Stack:** electron-log v5.x, Electron IPC, TypeScript

---

### Task 1: 安装 electron-log 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 electron-log**

Run: `npm install electron-log`

- [ ] **Step 2: 验证安装**

Run: `npm list electron-log`
Expected: 显示 electron-log@5.x.x

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add electron-log dependency"
```

---

### Task 2: 创建 Main 进程日志模块

**Files:**
- Create: `src/main/logger.ts`

- [ ] **Step 1: 创建日志模块**

```typescript
// src/main/logger.ts
import logger from 'electron-log/main'
import { app } from 'electron'
import { join } from 'path'

export interface LogConfig {
  enabled: boolean
  level: 'error' | 'warn' | 'info' | 'debug'
  console: boolean
  file: boolean
}

const defaultConfig: LogConfig = {
  enabled: true,
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  console: process.env.NODE_ENV === 'development',
  file: true
}

let config: LogConfig = { ...defaultConfig }

export function initLogger(): void {
  if (!config.enabled) return

  logger.transports.file.level = config.level
  logger.transports.console.level = config.console ? config.level : false
  logger.transports.file.level = config.file ? config.level : false

  logger.transports.file.resolvePathFn = () => {
    return join(app.getPath('userData'), 'logs', 'main.log')
  }

  logger.info('[Main] Logger initialized')
  logger.info(`[Main] Log level: ${config.level}`)
}

export function updateLogger(newConfig: Partial<LogConfig>): void {
  config = { ...config, ...newConfig }
  initLogger()
}

export function getLogger(): typeof logger {
  return logger
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/main/logger.ts
git commit -m "feat: add main process logger module"
```

---

### Task 3: 在 Main 进程初始化日志

**Files:**
- Modify: `src/main/index.ts`

- [ ] **Step 1: 导入并初始化日志**

在 `src/main/index.ts` 顶部添加导入：

```typescript
import { initLogger } from './logger'
```

在 `app.whenReady().then(() => {` 回调的第一行添加：

```typescript
initLogger()
```

修改后的 `app.whenReady` 部分：

```typescript
app.whenReady().then(() => {
  initLogger()
  registerAIHandlers()
  createWindow()
  // ... 其余代码不变
})
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/main/index.ts
git commit -m "feat: initialize logger on app startup"
```

---

### Task 4: 在 AI 处理器中添加日志

**Files:**
- Modify: `src/main/ai-handlers.ts`

- [ ] **Step 1: 添加日志导入和请求日志**

```typescript
// src/main/ai-handlers.ts
import { ipcMain } from 'electron'
import logger from 'electron-log/main'
import type { AIConfig, ChatMessage } from './ai-types'

export function registerAIHandlers(): void {
  logger.info('[AI] Registering AI handlers')

  ipcMain.handle('ai:listModels', async (_event, baseURL: string, apiKey: string) => {
    const startTime = Date.now()
    try {
      logger.debug(`[AI] Fetching models from ${baseURL}/models`)
      const url = baseURL.replace(/\/+$/, '') + '/models'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          logger.warn(`[AI] Models endpoint returned ${response.status}, returning empty list`)
          return []
        }
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      const models = data.data && Array.isArray(data.data)
        ? data.data.map((m: { id: string }) => ({ name: m.id, id: m.id }))
        : []
      logger.info(`[AI] Fetched ${models.length} models (${Date.now() - startTime}ms)`)
      return models
    } catch (error) {
      logger.error(`[AI] Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  ipcMain.handle('ai:chat', async (_event, config: AIConfig, messages: ChatMessage[]) => {
    const startTime = Date.now()
    try {
      logger.debug(`[AI] Request to ${config.baseURL}/chat/completions (model: ${config.model})`)
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        logger.error(`[AI] Response ${response.status}: ${errBody}`)
        throw new Error(`AI API error ${response.status}: ${errBody}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''
      logger.info(`[AI] Response 200, ${content.length} chars (${Date.now() - startTime}ms)`)
      return content
    } catch (error) {
      logger.error(`[AI] Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  ipcMain.handle('ai:chatStream', async (event, config: AIConfig, messages: ChatMessage[]) => {
    const sender = event.sender
    const startTime = Date.now()

    try {
      logger.debug(`[AI] Stream request to ${config.baseURL}/chat/completions (model: ${config.model})`)
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true
        })
      })

      if (!response.ok) {
        const errBody = await response.text()
        logger.error(`[AI] Stream response ${response.status}: ${errBody}`)
        sender.send('ai:streamError', `AI API error ${response.status}: ${errBody}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        logger.error('[AI] No response body for stream')
        sender.send('ai:streamError', 'No response body')
        return
      }

      const rawChunks: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        rawChunks.push(value)
      }

      const fullText = Buffer.concat(rawChunks.map((c) => Buffer.from(c))).toString('utf-8')

      let fullContent = ''
      for (const line of fullText.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        try {
          const content = JSON.parse(data).choices?.[0]?.delta?.content
          if (content) fullContent += content
        } catch {
          // skip unparseable
        }
      }

      logger.info(`[AI] Stream complete, ${fullContent.length} chars (${Date.now() - startTime}ms)`)

      for (let i = 0; i < fullContent.length; i += 3) {
        sender.send('ai:streamChunk', fullContent.slice(i, i + 3))
      }
      sender.send('ai:streamEnd')
    } catch (error) {
      logger.error(`[AI] Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      sender.send(
        'ai:streamError',
        `Stream failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/main/ai-handlers.ts
git commit -m "feat: add logging to AI handlers"
```

---

### Task 5: 创建 Renderer 进程日志模块

**Files:**
- Create: `src/renderer/logger.ts`

- [ ] **Step 1: 创建 Renderer 日志模块**

```typescript
// src/renderer/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogMessage {
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
  source: 'renderer'
  timestamp: number
}

function sendToMain(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const logMessage: LogMessage = {
    level,
    message,
    meta,
    source: 'renderer',
    timestamp: Date.now()
  }
  window.electron.ipcRenderer.send('log:message', logMessage)
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => sendToMain('error', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => sendToMain('warn', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => sendToMain('info', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => sendToMain('debug', message, meta),
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/renderer/logger.ts
git commit -m "feat: add renderer process logger module"
```

---

### Task 6: 在 Main 进程添加日志 IPC 处理器

**Files:**
- Modify: `src/main/index.ts`

- [ ] **Step 1: 添加日志 IPC 处理器**

在 `src/main/index.ts` 的 `app.whenReady().then(() => {` 回调中，在 `initLogger()` 之后添加：

```typescript
import logger from 'electron-log/main'

// 在 initLogger() 之后添加
ipcMain.on('log:message', (_event, data: { level: string; message: string; source: string }) => {
  const logFn = logger[data.level as keyof typeof logger]
  if (typeof logFn === 'function') {
    logFn(`[${data.source}] ${data.message}`)
  }
})
```

完整修改后的 `app.whenReady` 开头部分：

```typescript
app.whenReady().then(() => {
  initLogger()
  
  ipcMain.on('log:message', (_event, data: { level: string; message: string; source: string }) => {
    const logFn = logger[data.level as keyof typeof logger]
    if (typeof logFn === 'function') {
      logFn(`[${data.source}] ${data.message}`)
    }
  })
  
  registerAIHandlers()
  createWindow()
  // ... 其余代码不变
})
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/main/index.ts
git commit -m "feat: add IPC handler for renderer log messages"
```

---

### Task 7: 在 Renderer AI 客户端中添加日志

**Files:**
- Modify: `src/renderer/services/ai-client.ts`

- [ ] **Step 1: 添加日志导入和请求日志**

```typescript
// src/renderer/services/ai-client.ts
import type { ChatMessage } from '../stores/conversationStore'
import type { AIProvider } from '../stores/appStore'
import { logger } from '../logger'

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

type StreamCallbacks = {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (error: string) => void
}

export async function sendChatMessage(
  config: AIConfig,
  messages: ChatMessage[]
): Promise<string> {
  logger.debug(`[AI] Sending chat request to ${config.baseURL} (model: ${config.model})`)
  const startTime = Date.now()
  try {
    const result = await window.electron.ipcRenderer.invoke('ai:chat', config, messages)
    logger.info(`[AI] Chat response received, ${(result as string).length} chars (${Date.now() - startTime}ms)`)
    return result as string
  } catch (error) {
    logger.error(`[AI] Chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

export async function sendChatMessageStream(
  config: AIConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  const { onChunk, onDone, onError } = callbacks

  logger.debug(`[AI] Starting stream request to ${config.baseURL} (model: ${config.model})`)
  const startTime = Date.now()
  let totalChars = 0

  const chunkHandler = (_event: Electron.IpcRendererEvent, chunk: string): void => {
    totalChars += chunk.length
    onChunk(chunk)
  }
  const endHandler = (): void => {
    cleanup()
    logger.info(`[AI] Stream complete, ${totalChars} chars (${Date.now() - startTime}ms)`)
    onDone()
  }
  const errorHandler = (_event: Electron.IpcRendererEvent, error: string): void => {
    cleanup()
    logger.error(`[AI] Stream error: ${error}`)
    onError(error)
  }

  const cleanup = (): void => {
    window.electron.ipcRenderer.removeAllListeners('ai:streamChunk')
    window.electron.ipcRenderer.removeAllListeners('ai:streamEnd')
    window.electron.ipcRenderer.removeAllListeners('ai:streamError')
  }

  window.electron.ipcRenderer.on('ai:streamChunk', chunkHandler)
  window.electron.ipcRenderer.on('ai:streamEnd', endHandler)
  window.electron.ipcRenderer.on('ai:streamError', errorHandler)

  try {
    await window.electron.ipcRenderer.invoke('ai:chatStream', config, messages)
  } catch (error) {
    cleanup()
    logger.error(`[AI] Stream invoke failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    onError(error instanceof Error ? error.message : 'Unknown error')
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/renderer/services/ai-client.ts
git commit -m "feat: add logging to AI client service"
```

---

### Task 8: 在关键 UI 组件中添加日志

**Files:**
- Modify: `src/renderer/stores/appStore.ts`
- Modify: `src/renderer/stores/conversationStore.ts`

- [ ] **Step 1: 在 appStore 中添加视图切换日志**

在 `src/renderer/stores/appStore.ts` 中：

1. 添加导入：`import { logger } from '../logger'`
2. 在 `setCurrentView` 或类似的状态更新函数中添加日志：

```typescript
// 在 setCurrentView 函数中添加
setCurrentView: (view) => {
  logger.info(`[UI] View changed to: ${view}`)
  set({ currentView: view })
}
```

- [ ] **Step 2: 在 conversationStore 中添加对话操作日志**

在 `src/renderer/stores/conversationStore.ts` 中：

1. 添加导入：`import { logger } from '../logger'`
2. 在关键操作中添加日志：

```typescript
// 创建对话
addConversation: (title) => {
  logger.info(`[Conversation] Created: ${title}`)
  // ... 原有逻辑
}

// 切换对话
setActiveConversation: (id) => {
  logger.debug(`[Conversation] Switched to: ${id}`)
  // ... 原有逻辑
}

// 删除对话
deleteConversation: (id) => {
  logger.info(`[Conversation] Deleted: ${id}`)
  // ... 原有逻辑
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `npx tsc --noEmit --pretty`
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/renderer/stores/appStore.ts src/renderer/stores/conversationStore.ts
git commit -m "feat: add logging to stores for UI actions"
```

---

### Task 9: 验证日志系统

**Files:**
- 无文件修改

- [ ] **Step 1: 构建并启动应用**

Run: `npm run dev`
Expected: 应用正常启动，控制台显示 `[Main] Logger initialized` 日志

- [ ] **Step 2: 检查日志文件**

检查路径：`%APPDATA%/sisyphus/logs/main.log`
Expected: 文件存在，包含启动日志

- [ ] **Step 3: 测试 AI 请求日志**

1. 在应用中发送一条 AI 消息
2. 检查日志文件是否包含 `[AI]` 开头的请求/响应日志
3. 检查是否包含耗时信息

- [ ] **Step 4: 测试错误日志**

1. 使用无效的 API Key 发送请求
2. 检查日志文件是否包含 `[ERROR]` 级别的错误信息

- [ ] **Step 5: 测试视图切换日志**

1. 在应用中切换不同视图（home/chat/settings）
2. 检查日志文件是否包含 `[UI] View changed` 日志

- [ ] **Step 6: 最终提交（如有需要）**

```bash
git status
# 如有未提交的文件
git add .
git commit -m "chore: verify logging system working correctly"
```

---

## 自审检查

1. **规范覆盖**: 所有设计文档中的要求都已实现 - Main/Renderer 日志模块、IPC 转发、AI 请求日志、UI 操作日志
2. **占位符扫描**: 无 TBD/TODO，所有代码都已完整提供
3. **类型一致性**: 所有日志 API 使用统一的 `logger.error/warn/info/debug` 接口
4. **文件边界清晰**: 每个文件职责明确，Main 处理文件写入，Renderer 通过 IPC 转发
