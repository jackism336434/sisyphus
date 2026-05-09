# AGENTS.md — Sisyphus AI Client

Electron 30 + React 18 + TypeScript + Zustand + TailwindCSS desktop AI chat app.

## Commands

```bash
npm run dev          # Start dev server (electron-vite dev)
npm run build        # Production build (electron-vite build)
npm run package      # Package for distribution (electron-builder)
```

No test runner configured. No linter or formatter scripts in package.json.

TypeScript check only: `npx tsc --noEmit --pretty`

## Architecture: Three-Process Electron

- **Main process** (`src/main/`): Node.js — IPC handlers, file dialogs, AI API calls
- **Preload** (`src/preload/`): `@electron-toolkit/preload` — `contextBridge.exposeInMainWorld('api', {...})` exposes safe IPC methods to renderer
- **Renderer** (`src/renderer/`): React app — all UI lives here

**Critical**: Main process and preload changes require a full app restart. `npm run dev` hot-reloads the renderer only.

## IPC Bridge

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `ai:chat` | renderer→main | Single-shot AI response |
| `ai:chatStream` | renderer→main→renderer | Streaming AI (full collect then 3-char chunks via `ai:streamChunk`/`ai:streamEnd`/`ai:streamError`) |
| `ai:listModels` | renderer→main | Fetch available models from provider API |
| `select-avatar` | renderer→main | Native file dialog for avatar image |
| `select-files` | renderer→main | Native multi-file dialog, returns `{name, content, size}[]` |

Renderer calls: `window.api.selectAvatar()`, `window.api.selectFiles()`, `window.api.listModels(baseURL, apiKey)`

AI streaming: Uses `window.electron.ipcRenderer.on/invoke` directly (see `src/renderer/services/ai-client.ts`). Must call `removeAllListeners` on cleanup to prevent listener accumulation.

## State Management (Zustand)

| Store | Responsibility | Persisted? |
|-------|---------------|------------|
| `appStore` | View routing, provider/model selection, API configs, theme, user profile | No |
| `chatStore` | Transient streaming state (`isLoading`, `streamContent`) | No |
| `conversationStore` | Conversations, messages, active selection | Yes (localStorage) |

**Key pattern**: `conversationStore` owns all message data. `chatStore` is ephemeral streaming buffer only. On stream complete, `flushStream()` returns content and `addMessage()` saves it to `conversationStore`.

## View Routing

AppLayout renders one view based on `appStore.currentView`:
- `'home'` → HomeWorkspace (InputBox + QuickPrompts)
- `'chat'` → ChatView (message list + ChatInput)
- `'settings'` → SettingsView
- `'account'` → AccountView

## Models: Display Name vs API ID

`ModelOption { name: string, id: string }` — `name` is Chinese display label, `id` is the API model identifier. E.g. `{ name: "DeepSeek V4 Flash", id: "deepseek-chat" }`.

## AI Request Flow

1. Renderer builds `AIConfig` from `appStore.getCurrentConfig()` (provider, model, apiKey, baseURL)
2. Renderer builds message array from `conversationStore.getActiveMessages()`
3. Calls `sendChatMessageStream(config, messages, callbacks)` in `ai-client.ts`
4. Main process fetches SSE endpoint, buffers entire response, parses full content
5. Main process sends content back as 3-char chunks via IPC
6. Renderer's `onChunk` appends to `chatStore.streamContent`, `onDone` flushes to `conversationStore`

## Conventions

- All UI text is **Chinese** (简体中文)
- Dark theme only — custom colors defined in `tailwind.config.js` (`surface`, `muted`, etc.)
- Icons: use `lucide-react`, not emoji
- Path alias: `@/` → `src/renderer/` (configured in `electron.vite.config.ts` and `tsconfig.web.json`)
- No code comments unless explicitly requested
- User preferences: theme stays as dropdown (not toggle), logout icon in red
- Custom Tailwind classes: `input-glow`, `glass-panel`, `.sidebar-item`, `.prompt-chip`

## File Attachments

The "+" / paperclip button opens a native file dialog via `select-files` IPC. Selected text files are embedded into the message content with `[文件: filename]\ncontent` markers. Only UTF-8 text files are supported.

## Conversation Sidebar

Each conversation item shows a hover-revealed X button (lucide `X` icon) using `group`/`opacity-0 group-hover:opacity-100` pattern. Clicking X calls `conversationStore.deleteConversation()` which auto-switches active conversation.