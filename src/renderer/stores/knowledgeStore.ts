import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KnowledgeSpace {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface KnowledgeDoc {
  id: string
  spaceId: string
  type: 'note' | 'file'
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface RAGChunk {
  id: string
  docId: string
  content: string
  embedding: number[]
}

interface KnowledgeState {
  spaces: KnowledgeSpace[]
  docs: KnowledgeDoc[]

  addSpace: (name: string) => string
  updateSpace: (id: string, name: string) => void
  deleteSpace: (id: string) => void

  addDoc: (spaceId: string, type: 'note' | 'file', title: string, content: string) => string
  updateDoc: (id: string, title: string, content: string) => void
  deleteDoc: (id: string) => void
  getSpaceDocs: (spaceId: string) => KnowledgeDoc[]
}

let spaceIdCounter = 0
const nextSpaceId = () => `kb-space-${Date.now()}-${++spaceIdCounter}`

let docIdCounter = 0
const nextDocId = () => `kb-doc-${Date.now()}-${++docIdCounter}`

const VECTORS_KEY_PREFIX = 'sisyphus-kb-vectors-'

export function getVectorsKey(spaceId: string): string {
  return `${VECTORS_KEY_PREFIX}${spaceId}`
}

export function loadChunks(spaceId: string): RAGChunk[] {
  try {
    const raw = localStorage.getItem(getVectorsKey(spaceId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return []
}

export function saveChunks(spaceId: string, chunks: RAGChunk[]): void {
  localStorage.setItem(getVectorsKey(spaceId), JSON.stringify(chunks))
}

export function clearChunks(spaceId: string): void {
  localStorage.removeItem(getVectorsKey(spaceId))
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      spaces: [],
      docs: [],

      addSpace: (name: string) => {
        const id = nextSpaceId()
        const now = Date.now()
        const space: KnowledgeSpace = { id, name, createdAt: now, updatedAt: now }
        set((state) => ({ spaces: [...state.spaces, space] }))
        return id
      },

      updateSpace: (id: string, name: string) => {
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === id ? { ...s, name, updatedAt: Date.now() } : s
          )
        }))
      },

      deleteSpace: (id: string) => {
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== id),
          docs: state.docs.filter((d) => d.spaceId !== id)
        }))
        clearChunks(id)
      },

      addDoc: (spaceId: string, type: 'note' | 'file', title: string, content: string) => {
        const id = nextDocId()
        const now = Date.now()
        const doc: KnowledgeDoc = { id, spaceId, type, title, content, createdAt: now, updatedAt: now }
        set((state) => ({
          docs: [...state.docs, doc],
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, updatedAt: now } : s
          )
        }))
        return id
      },

      updateDoc: (id: string, title: string, content: string) => {
        const now = Date.now()
        set((state) => {
          const doc = state.docs.find((d) => d.id === id)
          if (!doc) return state
          return {
            docs: state.docs.map((d) =>
              d.id === id ? { ...d, title, content, updatedAt: now } : d
            ),
            spaces: state.spaces.map((s) =>
              s.id === doc.spaceId ? { ...s, updatedAt: now } : s
            )
          }
        })
      },

      deleteDoc: (id: string) => {
        set((state) => ({
          docs: state.docs.filter((d) => d.id !== id)
        }))
      },

      getSpaceDocs: (spaceId: string) => {
        return get().docs.filter((d) => d.spaceId === spaceId)
      }
    }),
    {
      name: 'sisyphus-knowledge',
      partialize: (state) => ({
        spaces: state.spaces,
        docs: state.docs
      })
    }
  )
)
