import { create } from 'zustand'

export type AIProvider = 'minimax' | 'glm' | 'deepseek'
export type View = 'home' | 'chat' | 'settings'

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

export const AI_MODELS: { provider: AIProvider; label: string; models: string[]; defaultBaseURL: string }[] = [
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultBaseURL: 'https://api.deepseek.com/v1'
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    models: ['abab6.5s-chat'],
    defaultBaseURL: 'https://api.minimax.chat/v1'
  },
  {
    provider: 'glm',
    label: 'GLM (Zhipu)',
    models: ['glm-4-flash'],
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4'
  }
]

const DEFAULT_CONFIGS: Record<AIProvider, AIConfig> = {
  deepseek: { apiKey: 'sk-placeholder', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  minimax: { apiKey: '', baseURL: 'https://api.minimax.chat/v1', model: 'abab6.5s-chat' },
  glm: { apiKey: '', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' }
}

interface AppState {
  currentView: View
  selectedProvider: AIProvider
  selectedModel: string
  configs: Record<AIProvider, AIConfig>

  setView: (view: View) => void
  setProvider: (provider: AIProvider) => void
  setModel: (model: string) => void
  updateConfig: (provider: AIProvider, config: Partial<AIConfig>) => void
  getCurrentConfig: () => AIConfig
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  selectedProvider: 'deepseek',
  selectedModel: 'deepseek-chat',
  configs: DEFAULT_CONFIGS,

  setView: (view) => set({ currentView: view }),

  setProvider: (provider) => {
    const configs = get().configs
    set({
      selectedProvider: provider,
      selectedModel: configs[provider].model
    })
  },

  setModel: (model) => set({ selectedModel: model }),

  updateConfig: (provider, config) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [provider]: { ...state.configs[provider], ...config }
      }
    })),

  getCurrentConfig: () => {
    const state = get()
    const config = state.configs[state.selectedProvider]
    return {
      ...config,
      model: state.selectedModel
    }
  }
}))
