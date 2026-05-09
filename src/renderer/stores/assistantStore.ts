import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomAssistant {
  id: string
  name: string
  systemPrompt: string
  createdAt: number
  updatedAt: number
}

interface AssistantState {
  assistants: CustomAssistant[]
  activeAssistantId: string | null

  addAssistant: (name: string, systemPrompt: string) => void
  updateAssistant: (id: string, data: Partial<Pick<CustomAssistant, 'name' | 'systemPrompt'>>) => void
  deleteAssistant: (id: string) => void
  setActiveAssistant: (id: string | null) => void
  getActiveAssistant: () => CustomAssistant | null
}

let idCounter = 0
const nextId = () => `asst-${Date.now()}-${++idCounter}`

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: [],
      activeAssistantId: null,

      addAssistant: (name: string, systemPrompt: string) => {
        const now = Date.now()
        const assistant: CustomAssistant = {
          id: nextId(),
          name,
          systemPrompt,
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          assistants: [...state.assistants, assistant]
        }))
      },

      updateAssistant: (id: string, data: Partial<Pick<CustomAssistant, 'name' | 'systemPrompt'>>) => {
        set((state) => ({
          assistants: state.assistants.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a
          )
        }))
      },

      deleteAssistant: (id: string) => {
        set((state) => ({
          assistants: state.assistants.filter((a) => a.id !== id),
          activeAssistantId: state.activeAssistantId === id ? null : state.activeAssistantId
        }))
      },

      setActiveAssistant: (id: string | null) => {
        set({ activeAssistantId: id })
      },

      getActiveAssistant: () => {
        const { assistants, activeAssistantId } = get()
        return assistants.find((a) => a.id === activeAssistantId) ?? null
      }
    }),
    {
      name: 'sisyphus-assistants',
      partialize: (state) => ({
        assistants: state.assistants,
        activeAssistantId: state.activeAssistantId
      })
    }
  )
)