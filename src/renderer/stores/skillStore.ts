import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SkillType = 'template' | 'queue'

export interface Skill {
  id: string
  name: string
  type: SkillType
  template?: string
  prompts: string[]
  variables?: string[]
  createdAt: number
  updatedAt: number
}

interface SkillState {
  skills: Skill[]
  activeSkillId: string | null

  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateSkill: (id: string, updates: Partial<Skill>) => void
  deleteSkill: (id: string) => void
  setActive: (id: string | null) => void
  getActive: () => Skill | null
}

let idCounter = 0
const nextId = () => `skill-${Date.now()}-${++idCounter}`

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: [],
      activeSkillId: null,

      addSkill: (skill) => {
        const now = Date.now()
        const newSkill: Skill = {
          ...skill,
          id: nextId(),
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          skills: [...state.skills, newSkill]
        }))
        return newSkill.id
      },

      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          )
        }))
      },

      deleteSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
          activeSkillId: state.activeSkillId === id ? null : state.activeSkillId
        }))
      },

      setActive: (id) => {
        set({ activeSkillId: id })
      },

      getActive: () => {
        const { skills, activeSkillId } = get()
        return skills.find((s) => s.id === activeSkillId) ?? null
      }
    }),
    {
      name: 'sisyphus-skills',
      partialize: (state) => ({
        skills: state.skills,
        activeSkillId: state.activeSkillId
      })
    }
  )
)
