import { create } from 'zustand'

interface ChatState {
  isLoading: boolean
  streamContent: string

  setLoading: (loading: boolean) => void
  appendStreamContent: (chunk: string) => void
  flushStream: () => string
}

export const useChatStore = create<ChatState>((set, get) => ({
  isLoading: false,
  streamContent: '',

  setLoading: (loading) => set({ isLoading: loading }),

  appendStreamContent: (chunk) =>
    set((state) => ({
      streamContent: state.streamContent + chunk
    })),

  flushStream: () => {
    const content = get().streamContent
    set({ streamContent: '', isLoading: false })
    return content
  }
}))