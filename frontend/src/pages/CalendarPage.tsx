// frontend/src/pages/CalendarPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '../utils/api'
import type { WorkDay } from '../types'
import { useStore } from '../store'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CalendarPage() {
  const navigate = useNavigate()
  const { user } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workDays, setWorkDays] = useState<WorkDay[]>([])
  const [loading, setLoading] = useState(false)
  const [modalDay, setModalDay] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  useEffect(() => {
    loadWorkDays()
  }, [year, month])

  const loadWorkDays = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/calendar/${year}/${month}`)
      console.log('Loaded work days:', data)
      setWorkDays(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getWorkDay = (date: Date) =>
    workDays.find(d => isSameDay(new Date(d.date), date))

  const handleDayPress = (date: Date) => {
    const existingDay = getWorkDay(date)
    if (existingDay) {
      if (existingDay.type === 'WORK') {
        navigate(`/workday/${existingDay.id}`)
      }
      return
    }
    setModalDay(date)
  }

  const handleSelectType = async (type: 'WORK' | 'DAY_OFF') => {
    if (!modalDay) return
    setModalDay(null)
    try {
      const { data } = await api.post('/calendar/day', {
        date: format(modalDay, 'yyyy-MM-dd'),
        type,
      })
      setWorkDays(prev => [...prev.filter(d => !isSameDay(new Date(d.date), modalDay)), data])
      if (type === 'WORK') {
        navigate(`/workday/${data.id}`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Строим сетку
  const firstDay = startOfMonth(currentDate)
  const lastDay = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })

  // Смещение: понедельник = 0
  const startOffset = (getDay(firstDay) + 6) % 7

  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month, 1))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--tg-theme-bg-color)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <button onClick={prevMonth} className="p-2 rounded-xl active:bg-gray-100 text-xl">‹</button>
          <div className="text-center">
            <div className="font-bold text-lg capitalize">
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </div>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl active:bg-gray-100 text-xl">›</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mt-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1"
              style={{ color: 'var(--tg-theme-hint-color)' }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const workDay = getWorkDay(day)
            const isWork = workDay?.type === 'WORK'
            const isDayOff = workDay?.type === 'DAY_OFF'
            const isTodayDay = isToday(day)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayPress(day)}
                className={`
                  relative aspect-square rounded-xl flex flex-col items-center justify-center
                  transition-all active:scale-95
                  ${isWork ? 'bg-green-500 text-white' : ''}
                  ${isDayOff ? 'bg-red-400 text-white' : ''}
                  ${!workDay && isTodayDay ? 'ring-2 ring-blue-400' : ''}
                  ${!workDay ? 'hover:bg-gray-100' : ''}
                `}
                style={!workDay ? { background: 'var(--tg-theme-secondary-bg-color)' } : undefined}
              >
                <span className={`text-sm font-semibold ${!workDay && isTodayDay ? 'text-blue-500' : ''}`}>
                  {format(day, 'd')}
                </span>
                {isWork && workDay.tasksCount ? (
                  <span className="text-xs opacity-80">{workDay.tasksCount}тз</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-4 text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          Рабочий
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          Выходной
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 mt-6">
        <div className="card text-center">
          <p className="font-semibold">👋 {user?.firstName}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Нажмите на день чтобы отметить его
          </p>
        </div>
      </div>

      {/* Day type modal */}
      {modalDay && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setModalDay(null)}>
          <div
            className="w-full rounded-t-3xl p-6"
            style={{ background: 'var(--tg-theme-bg-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-center mb-1">
              {format(modalDay, 'd MMMM', { locale: ru })}
            </h3>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Выберите тип дня
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSelectType('WORK')}
                className="py-4 rounded-2xl font-bold text-lg bg-green-500 text-white active:scale-95 transition-all"
              >
                💼 Рабочий день
              </button>
              <button
                onClick={() => handleSelectType('DAY_OFF')}
                className="py-4 rounded-2xl font-bold text-lg bg-red-400 text-white active:scale-95 transition-all"
              >
                🏖️ Выходной
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
