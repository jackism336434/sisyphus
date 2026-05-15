import type { View } from '../stores/appStore'

export interface CommandDefinition {
  id: string
  name: string
  description: string
}

export const COMMANDS: CommandDefinition[] = [
  { id: 'new', name: '/new', description: '新建对话' },
  { id: 'clear', name: '/clear', description: '清空当前对话' },
  { id: 'settings', name: '/settings', description: '打开模型配置' },
  { id: 'space', name: '/space', description: '打开知识空间' },
  { id: 'model', name: '/model', description: '切换模型' },
  { id: 'assistant', name: '/assistant', description: '选择自定义助手' },
  { id: 'help', name: '/help', description: '显示命令帮助' }
]

export type CommandResult =
  | { type: 'navigate'; view: View }
  | { type: 'clearMessages' }
  | { type: 'showModelMenu' }
  | { type: 'showAssistantMenu' }
  | { type: 'showHelp'; commands: CommandDefinition[] }
  | { type: 'none' }

export function filterCommands(query: string): CommandDefinition[] {
  const q = query.toLowerCase()
  return COMMANDS.filter((cmd) =>
    cmd.name.toLowerCase().includes(q) ||
    cmd.description.toLowerCase().includes(q)
  )
}

export function executeCommand(commandId: string): CommandResult {
  switch (commandId) {
    case 'new':
      return { type: 'navigate', view: 'home' }
    case 'clear':
      return { type: 'clearMessages' }
    case 'settings':
      return { type: 'navigate', view: 'settings' }
    case 'space':
      return { type: 'navigate', view: 'knowledge' }
    case 'model':
      return { type: 'showModelMenu' }
    case 'assistant':
      return { type: 'showAssistantMenu' }
    case 'help':
      return { type: 'showHelp', commands: COMMANDS }
    default:
      return { type: 'none' }
  }
}

export function parseCommand(text: string): { commandId: string | null; query: string } {
  if (!text.startsWith('/')) return { commandId: null, query: '' }
  const parts = text.slice(1).trim().split(/\s+/)
  const id = parts[0]
  const matched = COMMANDS.find((c) => c.id === id)
  if (matched) return { commandId: id, query: '' }
  return { commandId: null, query: text.slice(1) }
}
