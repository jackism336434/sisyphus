import { create } from 'zustand'

export type AIProvider = 'minimax' | 'glm' | 'deepseek'
export type View = 'home' | 'chat' | 'settings' | 'account' | 'custom'

export interface ModelOption {
  name: string
  id: string
}

interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

export const AI_MODELS: { provider: AIProvider; label: string; models: ModelOption[]; defaultBaseURL: string }[] = [
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    models: [
      { name: 'DeepSeek V4 Flash', id: 'deepseek-chat' },
      { name: 'DeepSeek V4 Pro', id: 'deepseek-reasoner' }
    ],
    defaultBaseURL: 'https://api.deepseek.com/v1'
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    models: [
      { name: 'MiniMax M2', id: 'abab6.5s-chat' }
    ],
    defaultBaseURL: 'https://api.minimax.chat/v1'
  },
  {
    provider: 'glm',
    label: 'GLM (Zhipu)',
    models: [
      { name: 'GLM-4 Plus', id: 'glm-4-flash' }
    ],
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4'
  }
]

const DEFAULT_CONFIGS: Record<AIProvider, AIConfig> = {
  deepseek: { apiKey: 'sk-placeholder', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  minimax: { apiKey: '', baseURL: 'https://api.minimax.chat/v1', model: 'abab6.5s-chat' },
  glm: { apiKey: '', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' }
}

export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  currentView: View
  selectedProvider: AIProvider
  selectedModel: string
  configs: Record<AIProvider, AIConfig>
  theme: Theme
  isUserMenuOpen: boolean
  avatarUrl: string | null
  displayName: string
  username: string
  email: string
  dynamicModels: Record<AIProvider, ModelOption[] | null>

  setView: (view: View) => void
  setProvider: (provider: AIProvider) => void
  setModel: (model: string) => void
  updateConfig: (provider: AIProvider, config: Partial<AIConfig>) => void
  getCurrentConfig: () => AIConfig
  setTheme: (theme: Theme) => void
  setUserMenuOpen: (open: boolean) => void
  setAvatar: (url: string) => void
  setDisplayName: (name: string) => void
  setUsername: (name: string) => void
  setEmail: (email: string) => void
  resetAccount: () => void
  setModels: (provider: AIProvider, models: ModelOption[]) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: 'home',
  selectedProvider: 'deepseek',
  selectedModel: 'deepseek-chat',
  configs: DEFAULT_CONFIGS,
  theme: 'dark',
  isUserMenuOpen: false,
  avatarUrl: null,
  displayName: '',
  username: '',
  email: '',
  dynamicModels: { deepseek: null, minimax: null, glm: null },

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
  },

  setTheme: (theme) => set({ theme }),

  setUserMenuOpen: (open) => set({ isUserMenuOpen: open }),
  setAvatar: (url) => set({ avatarUrl: url }),
  setDisplayName: (name) => set({ displayName: name }),
  setUsername: (name) => set({ username: name }),
  setEmail: (email) => set({ email: email }),
  resetAccount: () => set({
    avatarUrl: null,
    displayName: '',
    username: '',
    email: ''
  }),
  setModels: (provider, models) =>
    set((state) => ({
      dynamicModels: {
        ...state.dynamicModels,
        [provider]: models
      }
    }))
}))
