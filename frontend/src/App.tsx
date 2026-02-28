// frontend/src/App.tsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import { api } from './utils/api'
import { CalendarPage } from './pages/CalendarPage'
import { WorkDayPage } from './pages/WorkDayPage'
import { TaskPage } from './pages/TaskPage'
import { LoadingScreen } from './components/LoadingScreen'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: any
        ready: () => void
        expand: () => void
        MainButton: any
        BackButton: any
        themeParams: any
      }
    }
  }
}

export default function App() {
  const { token, user, setAuth, loadNorms } = useStore()
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()

      // Применяем тему Telegram
      const theme = tg.themeParams
      if (theme) {
        const root = document.documentElement
        if (theme.bg_color) root.style.setProperty('--tg-theme-bg-color', theme.bg_color)
        if (theme.text_color) root.style.setProperty('--tg-theme-text-color', theme.text_color)
        if (theme.button_color) root.style.setProperty('--tg-theme-button-color', theme.button_color)
        if (theme.button_text_color) root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color)
        if (theme.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color)
        if (theme.hint_color) root.style.setProperty('--tg-theme-hint-color', theme.hint_color)
      }
    }

    authenticate()
  }, [])

  const authenticate = async () => {
    try {
      const tg = window.Telegram?.WebApp
      let initData = tg?.initData

      // Режим разработки — имитация пользователя
      if (!initData && import.meta.env.DEV) {
        initData = 'dev:{"id":123456789,"first_name":"Dev","username":"devuser"}'
      }

      if (!initData) {
        setIsAuthLoading(false)
        return
      }

      const { data } = await api.post('/auth/verify', { initData })
      setAuth(data.user, data.token)
      await loadNorms()
    } catch (e) {
      console.error('Auth failed', e)
    } finally {
      setIsAuthLoading(false)
    }
  }

  if (isAuthLoading) return <LoadingScreen />

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold mb-2">Нет доступа</h1>
        <p className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
          Вас нет в системе PrintTrack.<br />
          Обратитесь к администратору.
        </p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/workday/:workDayId" element={<WorkDayPage />} />
        <Route path="/task/:taskId" element={<TaskPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
