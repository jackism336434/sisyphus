import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

interface ConversationState {
  conversations: Conversation[]
  activeId: string | null

  createConversation: (firstMessage: string) => string
  addMessage: (message: ChatMessage) => void
  appendToLastMessage: (content: string) => void
  deleteConversation: (id: string) => void
  clearAll: () => void
  setActive: (id: string | null) => void
  getActive: () => Conversation | null
  getActiveMessages: () => ChatMessage[]
}

let convId = 0
const nextConvId = () => `conv-${Date.now()}-${++convId}`

let msgId = 0
export const nextMsgId = () => `msg-${Date.now()}-${++msgId}`

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,

      createConversation: (firstMessage: string) => {
        const id = nextConvId()
        const now = Date.now()
        const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
        const newConv: Conversation = {
          id,
          title,
          messages: [],
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeId: id
        }))
        return id
      },

      addMessage: (message: ChatMessage) => {
        const { activeId } = get()
        if (!activeId) return
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
              : c
          )
        }))
      },

      appendToLastMessage: (content: string) => {
        const { activeId } = get()
        if (!activeId) return
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== activeId) return c
            const msgs = [...c.messages]
            const last = msgs[msgs.length - 1]
            if (last && last.role === 'assistant') {
              msgs[msgs.length - 1] = { ...last, content: last.content + content }
            }
            return { ...c, messages: msgs, updatedAt: Date.now() }
          })
        }))
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id)
          return {
            conversations: filtered,
            activeId: state.activeId === id ? (filtered[0]?.id ?? null) : state.activeId
          }
        })
      },

      clearAll: () => {
        set({ conversations: [], activeId: null })
      },

      setActive: (id: string | null) => {
        set({ activeId: id })
      },

      getActive: () => {
        const { conversations, activeId } = get()
        return conversations.find((c) => c.id === activeId) ?? null
      },

      getActiveMessages: () => {
        const active = get().getActive()
        return active?.messages ?? []
      }
    }),
    {
      name: 'sisyphus-conversations',
      partialize: (state) => ({
        conversations: state.conversations,
        activeId: state.activeId
      })
    }
  )
)