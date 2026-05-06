import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  streamContent: string

  addMessage: (msg: ChatMessage) => void
  setLoading: (loading: boolean) => void
  appendStreamContent: (chunk: string) => void
  flushStream: () => void
  clearMessages: () => void
}

let messageId = 0
const nextId = () => `msg-${++messageId}`

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  streamContent: '',

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg]
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  appendStreamContent: (chunk) =>
    set((state) => ({
      streamContent: state.streamContent + chunk
    })),

  flushStream: () => {
    const content = get().streamContent
    if (!content) return
    set((state) => ({
      messages: [
        ...state.messages,
        { id: nextId(), role: 'assistant', content }
      ],
      streamContent: '',
      isLoading: false
    }))
  },

  clearMessages: () => set({ messages: [], streamContent: '', isLoading: false })
}))

export { nextId }
