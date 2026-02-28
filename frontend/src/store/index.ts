// frontend/src/store/index.ts
import { create } from 'zustand'
import type { User, WorkDay, Task, OperationNorm } from '../types'
import { api } from '../utils/api'

interface AppState {
  user: User | null
  token: string | null
  currentWorkDay: WorkDay | null
  norms: OperationNorm[]
  isLoading: boolean

  setAuth: (user: User, token: string) => void
  logout: () => void
  setCurrentWorkDay: (day: WorkDay | null) => void
  loadNorms: () => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('pt_token'),
  currentWorkDay: null,
  norms: [],
  isLoading: false,

  setAuth: (user, token) => {
    localStorage.setItem('pt_token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('pt_token')
    set({ user: null, token: null, currentWorkDay: null })
  },

  setCurrentWorkDay: (day) => set({ currentWorkDay: day }),

  loadNorms: async () => {
    try {
      const { data } = await api.get('/norms')
      set({ norms: data })
    } catch (e) {
      console.error('Failed to load norms', e)
    }
  },
}))
