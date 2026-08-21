// mon-agenda-pedago/lib/store.ts
import { create } from 'zustand'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  district: string
  province: string
  level: string
  schoolId?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('token', token)
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => {
    set({ user: null, token: null })
    localStorage.removeItem('token')
  },
  initializeAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        set({ user: data.user, token, isLoading: false })
      } else {
        localStorage.removeItem('token')
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Auth init error:', error)
      set({ isLoading: false })
    }
  }
}))

interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}))

// Settings store: persist sections order and other lightweight UI settings
type SectionKey = 'notes' | 'calendar' | 'surveillances'
interface SettingsStore {
  sectionsOrder: SectionKey[]
  setSectionsOrder: (order: SectionKey[]) => void
  loadFromLocal: () => void
}

const DEFAULT_ORDER: SectionKey[] = ['calendar', 'notes', 'surveillances']

export const useSettingsStore = create<SettingsStore>((set) => ({
  sectionsOrder: DEFAULT_ORDER,
  setSectionsOrder: (order) => {
    set({ sectionsOrder: order })
    try {
      localStorage.setItem('agenda.sectionsOrder', JSON.stringify(order))
    } catch (e) {
      console.error('Failed to persist sectionsOrder', e)
    }
  },
  loadFromLocal: () => {
    try {
      const raw = localStorage.getItem('agenda.sectionsOrder')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) set({ sectionsOrder: parsed })
      }
    } catch (e) {
      console.error('Failed to load sectionsOrder', e)
    }
  }
}))