export type AIProvider = 'minimax' | 'glm' | 'deepseek'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseURL: string
  model: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface AIModelOption {
  provider: AIProvider
  label: string
  models: string[]
  defaultBaseURL: string
}

export const AI_MODELS: AIModelOption[] = [
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultBaseURL: 'https://api.deepseek.com/v1'
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    models: ['abab6.5s-chat', 'abab6.5-chat'],
    defaultBaseURL: 'https://api.minimax.chat/v1'
  },
  {
    provider: 'glm',
    label: 'GLM (Zhipu)',
    models: ['glm-4', 'glm-4-flash'],
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4'
  }
]
