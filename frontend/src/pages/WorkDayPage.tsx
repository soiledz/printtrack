// frontend/src/pages/WorkDayPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { api } from '../utils/api'
import type { Task, WorkDay } from '../types'
import { formatDuration } from '../utils/time'

export function WorkDayPage() {
  const { workDayId } = useParams()
  const navigate = useNavigate()

  const [workDay, setWorkDay] = useState<WorkDay | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskNumber, setTaskNumber] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadData()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [workDayId])

  const loadData = async () => {
    try {
      const [wd, t] = await Promise.all([
        api.get(`/calendar/${new Date().getFullYear()}/${new Date().getMonth() + 1}`),
        api.get(`/tasks?workDayId=${workDayId}`),
      ])
      const day = wd.data.find((d: WorkDay) => d.id === Number(workDayId))
      setWorkDay(day || null)
      setTasks(t.data)

      if (day?.startedAt) {
        const start = new Date(day.startedAt).getTime()
        intervalRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - start) / 1000))
        }, 1000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAddTask = async () => {
    if (!taskNumber.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/tasks', {
        workDayId: Number(workDayId),
        taskNumber: taskNumber.trim(),
        description: taskDescription.trim() || undefined,
      })
      setTasks(prev => [...prev, data])
      setShowAddTask(false)
      setTaskNumber('')
      setTaskDescription('')
      navigate(`/task/${data.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const dayDate = workDay ? new Date(workDay.date) : new Date()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--tg-theme-bg-color)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl active:scale-95"
          style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
          ‹
        </button>
        <div>
          <div className="font-bold text-lg capitalize">
            {format(dayDate, 'EEEE', { locale: ru })}
          </div>
          <div className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {format(dayDate, 'd MMMM yyyy', { locale: ru })}
          </div>
        </div>
      </div>

      {/* Work timer */}
      <div className="mx-4 mb-4 card text-center">
        <div className="text-xs mb-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
          Рабочий день
        </div>
        <div className="text-3xl font-mono font-bold tabular-nums">
          {formatDuration(elapsed)}
        </div>
      </div>

      {/* Tasks list */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Задания</h2>
          <span className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
            {tasks.length} тз
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => navigate(`/task/${task.id}`)}
              className="card text-left w-full active:scale-[0.98] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">№ {task.taskNumber}</div>
                  {task.description && (
                    <div className="text-sm mt-0.5" style={{ color: 'var(--tg-theme-hint-color)' }}>
                      {task.description}
                    </div>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  task.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {task.status === 'COMPLETED' ? '✓ Выполнено' : '⏱ В работе'}
                </div>
              </div>

              {task.status === 'COMPLETED' && task.efficiency != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(task.efficiency, 100)}%`,
                        background: task.efficiency >= 100 ? '#22c55e' : task.efficiency >= 75 ? '#eab308' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold">{task.efficiency}%</span>
                </div>
              )}

              <div className="text-xs mt-1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                {task.operations.length} операций
              </div>
            </button>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8" style={{ color: 'var(--tg-theme-hint-color)' }}>
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">Нет заданий. Добавьте первое!</p>
          </div>
        )}
      </div>

      {/* Add task button */}
      <div className="p-4 mt-auto">
        <button className="btn-primary" onClick={() => setShowAddTask(true)}>
          + Новое задание
        </button>
      </div>

      {/* Add task modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddTask(false)}>
          <div
            className="w-full rounded-t-3xl p-6"
            style={{ background: 'var(--tg-theme-bg-color)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">Новое задание</h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Номер ТЗ *
                </label>
                <input
                  type="text"
                  value={taskNumber}
                  onChange={e => setTaskNumber(e.target.value)}
                  placeholder="Например: ТЗ-123"
                  className="w-full px-4 py-3 rounded-xl border-0 outline-none text-base"
                  style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Описание (необязательно)
                </label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  placeholder="Что нужно сделать"
                  className="w-full px-4 py-3 rounded-xl border-0 outline-none text-base"
                  style={{ background: 'var(--tg-theme-secondary-bg-color)' }}
                />
              </div>
              <button
                className="btn-primary mt-2"
                onClick={handleAddTask}
                disabled={!taskNumber.trim() || loading}
              >
                {loading ? 'Создание...' : 'Начать работу →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
