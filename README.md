# Sisyphus AI Client

Sisyphus 是一款基于 Electron + React + TypeScript 构建的桌面端 AI 助手客户端，面向多模型对话、个人知识库问答、提示词技能管理和自定义助手场景。项目采用 Electron 三进程架构，将 AI 请求、文件系统能力和原生系统对话框收敛在 Main Process，通过 Preload 暴露安全 IPC 接口，Renderer 专注负责交互体验和状态管理。

## 项目亮点

- 桌面端 AI 客户端：基于 Electron 30 构建跨平台应用，支持 Windows / macOS / Linux 打包。
- 多模型接入：内置 DeepSeek、MiniMax、GLM 等供应商配置，支持自定义 API Key、Base URL、模型 ID 和动态模型拉取。
- 流式对话体验：Renderer 通过 IPC 调用 Main Process 发起 AI 请求，并使用 `ai:streamChunk` / `ai:streamEnd` / `ai:streamError` 事件模拟流式输出。
- 本地知识库 RAG：基于 `@xenova/transformers` 在本地生成文本向量，使用余弦相似度检索相关片段并注入 System Prompt。
- 安全 IPC 边界：开启 `contextIsolation`，关闭 `nodeIntegration`，通过 `contextBridge` 暴露最小化 API，隔离 Node.js 能力与前端页面。
- 状态分层清晰：使用 Zustand 管理配置、会话、流式缓冲、知识空间、技能和自定义助手，并对关键数据进行 localStorage 持久化。
- 文件附件能力：通过 Electron 原生文件选择器读取 UTF-8 文本文件，将附件内容结构化拼接进用户消息。
- 命令式输入：支持 `/new`、`/clear`、`/settings`、`/space`、`/model`、`/assistant`、`/help` 等快捷命令。
- 工程化打包：使用 electron-vite 进行开发与构建，使用 electron-builder 输出安装包。

## 技术栈

| 分类           | 技术                                           |
| ------------ | -------------------------------------------- |
| 桌面框架         | Electron 30                                  |
| 前端框架         | React 18、TypeScript                          |
| 构建工具         | electron-vite、Vite                           |
| 状态管理         | Zustand、zustand/middleware persist           |
| 样式方案         | TailwindCSS、PostCSS、Autoprefixer             |
| 图标           | lucide-react                                 |
| Markdown 渲染  | react-markdown                               |
| 本地 Embedding | @xenova/transformers、Xenova/all-MiniLM-L6-v2 |
| 日志           | electron-log                                 |
| 打包           | electron-builder                             |

## 核心功能

### 多模型 AI 对话

项目内置多个 OpenAI-compatible API 提供商配置：

- DeepSeek：`https://api.deepseek.com/v1`
- MiniMax：`https://api.minimax.chat/v1`
- GLM：`https://open.bigmodel.cn/api/paas/v4`

Renderer 从 `appStore` 中读取当前供应商、模型、API Key 和 Base URL，组装为 `AIConfig` 后通过 IPC 发送到 Main Process。Main Process 统一调用 `/chat/completions` 接口，避免将网络请求和敏感配置处理散落在 UI 层。

### 流式响应链路

流式对话采用如下链路：

1. Renderer 组装上下文消息。
2. `sendChatMessageStream()` 调用 `ai:chatStream` IPC。
3. Main Process 请求 AI Provider 的 SSE 接口。
4. Main Process 解析完整 SSE 内容。
5. 按 3 个字符一组发送 `ai:streamChunk`。
6. Renderer 将 chunk 写入 `chatStore.streamContent`。
7. 响应结束后调用 `flushStream()`，再将最终 assistant 消息落到 `conversationStore`。

这种设计让 UI 层保持轻量，流式临时状态和长期会话数据也被明确分离。

### 本地知识库与 RAG

知识空间支持创建空间、添加笔记或文件文档，并对文本内容建立本地向量索引：

- 文档按段落切分为 chunk。
- 使用 `Xenova/all-MiniLM-L6-v2` 生成归一化 embedding。
- 向量数据按知识空间存入 localStorage。
- 对话时根据用户问题生成查询向量。
- 通过余弦相似度取 TopK 相关片段。
- 将参考资料组装为 System Prompt 注入模型上下文。

该方案不依赖外部向量数据库，适合个人桌面端轻量知识库问答场景。

### 自定义助手

用户可以创建多个自定义助手，每个助手包含名称和 System Prompt。对话时如果选择了助手，系统会将对应 Prompt 注入消息上下文，使同一个模型可以承担不同角色或任务模板。

### 技能系统

技能模块支持两类能力：

- `template`：模板型技能，用变量和提示词模板生成标准化任务输入。
- `queue`：队列型技能，将多条 Prompt 组织为可复用流程。

技能数据通过 Zustand 持久化，适用于沉淀高频工作流。

### 文件附件

附件按钮会调用 Main Process 的 `select-files` IPC，使用 Electron 原生文件选择器读取文本文件。支持常见源码、配置、Markdown、日志、CSV、SQL 等 UTF-8 文本格式。读取后以如下结构拼接进消息：

```text
[文件: filename]
content
```

### 命令面板

输入框支持 `/` 命令补全和键盘选择，常用操作可以不离开输入区域完成：

| 命令           | 功能      |
| ------------ | ------- |
| `/new`       | 新建对话    |
| `/clear`     | 清空当前对话  |
| `/settings`  | 打开模型配置  |
| `/space`     | 打开知识空间  |
| `/model`     | 切换模型    |
| `/assistant` | 选择自定义助手 |
| `/help`      | 显示命令帮助  |

## 架构设计

项目采用典型 Electron 三进程架构：

```text
src/
  main/        Electron Main Process，负责窗口、IPC、文件系统、AI API 请求
  preload/     安全桥接层，通过 contextBridge 暴露受控 API
  renderer/    React 前端应用，负责 UI、交互和状态管理
```

### Main Process

主要职责：

- 创建 BrowserWindow。
- 注册 AI 请求 IPC。
- 注册文件选择、头像选择、Markdown 保存等原生能力。
- 统一处理日志。
- 持有 Node.js 和系统 API 权限。

核心文件：

- `src/main/index.ts`
- `src/main/ai-handlers.ts`
- `src/main/ai-types.ts`
- `src/main/logger.ts`

### Preload

Preload 使用 `contextBridge.exposeInMainWorld()` 暴露安全 API：

- `selectAvatar()`
- `selectFiles()`
- `listModels(baseURL, apiKey)`
- `saveFileDialog(defaultName)`
- `writeFileChunk(filePath, content)`

同时暴露 `electronAPI`，用于 Renderer 订阅 AI 流式事件。

### Renderer

Renderer 是 React 单页应用，主要包含：

- 首页工作区
- 聊天视图
- 设置页
- 账户页
- 自定义助手页
- 技能页
- 知识空间页
- 历史会话页

路由不依赖 React Router，而是通过 `appStore.currentView` 控制 `AppLayout` 渲染不同视图。

## 状态管理

| Store               | 职责                      | 是否持久化 |
| ------------------- | ----------------------- | ----- |
| `appStore`          | 当前视图、模型供应商、模型配置、主题、账户信息 | 是     |
| `conversationStore` | 会话、消息、当前会话、会话关联知识空间     | 是     |
| `chatStore`         | 加载状态、临时流式输出缓冲           | 否     |
| `knowledgeStore`    | 知识空间、文档、向量存储辅助方法        | 是     |
| `assistantStore`    | 自定义助手和当前助手              | 是     |
| `skillStore`        | 技能定义和当前技能               | 是     |

关键设计原则：

- 会话消息只由 `conversationStore` 管理。
- 流式输出只暂存在 `chatStore`。
- AI 配置和 UI 偏好存储在 `appStore`。
- RAG 向量索引按知识空间拆分存储。

## 项目目录

```text
.
├── src
│   ├── main
│   │   ├── ai-handlers.ts
│   │   ├── ai-types.ts
│   │   ├── index.ts
│   │   └── logger.ts
│   ├── preload
│   │   ├── index.d.ts
│   │   └── index.ts
│   └── renderer
│       ├── components
│       │   ├── chat
│       │   ├── custom
│       │   ├── history
│       │   ├── knowledge
│       │   ├── layout
│       │   ├── settings
│       │   ├── skills
│       │   └── workspace
│       ├── services
│       │   ├── ai-client.ts
│       │   ├── commands.ts
│       │   └── rag.ts
│       ├── stores
│       ├── styles
│       ├── App.tsx
│       └── main.tsx
├── electron-builder.yml
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

注意：Renderer 支持热更新；Main Process 和 Preload 修改后需要完整重启应用。

### 类型检查

```bash
npx tsc --noEmit --pretty
```

### 生产构建

```bash
npm run build
```

### 打包安装包

```bash
npm run package
```

打包配置位于 `electron-builder.yml`，当前配置支持：

- Windows：NSIS 安装包
- macOS：DMG
- Linux：AppImage

## 安全设计

- `contextIsolation: true`：隔离 Renderer 上下文与 Electron API。
- `nodeIntegration: false`：避免前端页面直接访问 Node.js。
- Preload 暴露最小 API 面：只开放必要文件选择、模型列表、文件写入等能力。
- AI 请求在 Main Process 发起：减少 Renderer 暴露敏感实现细节。
- 文件读取通过原生文件选择器触发，不直接暴露任意路径读取接口。

## 性能与体验优化

- 使用 electron-vite 加速 Electron + React 开发构建流程。
- 使用 Zustand 细粒度订阅状态，降低全局状态更新带来的无关渲染。
- 将流式缓冲与持久化消息拆分，避免每个 chunk 都修改完整会话结构。
- 本地 RAG 向量检索使用归一化 embedding 和余弦相似度，适合轻量个人知识库。
- 输入框自动高度、命令菜单键盘导航、模型快捷切换提升高频输入体验。
- 使用 TailwindCSS 定制暗色主题，减少样式文件维护成本。

# 

### 
