// frontend/src/pages/TaskPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import type { Task, Operation, OperationType } from '../types'
import { useStore } from '../store'
import { formatDuration } from '../utils/time'

// Порядок операций шелкографии
const OPERATIONS_ORDER: { type: OperationType; label: string; optional?: boolean; icon: string }[] = [
  { type: 'EMULSION_POUR', label: 'Поливка эмульсией', icon: '🪣' },
  { type: 'EXPOSURE', label: 'Засветка', icon: '💡' },
  { type: 'DRYING', label: 'Просушка', icon: '🌬️', optional: true },
  { type: 'FIXING', label: 'Закрепление', icon: '🔧', optional: true },
  { type: 'SETUP_SEMIAUTO', label: 'Настройка (полуавтомат)', icon: '⚙️', optional: true },
  { type: 'SETUP_MANUAL', label: 'Настройка (ручная)', icon: '🖐️', optional: true },
  { type: 'PRINTING', label: 'Печать', icon: '🖨️' },
  { type: 'WASHING', label: 'Замывка', icon: '🚿' },
  { type: 'INK_MIXING', label: 'Замес краски', icon: '🎨', optional: true },
  { type: 'SCREEN_WASHING', label: 'Смывка печатной формы', icon: '🧹' },
]

export function TaskPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { norms } = useStore()

  const [task, setTask] = useState<Task | null>(null)
  const [taskElapsed, setTaskElapsed] = useState(0)
  const [activeOpId, setActiveOpId] = useState<number | null>(null)
  const [activeOpElapsed, setActiveOpElapsed] = useState(0)
  const [impressions, setImpressions] = useState('')
  const [comment, setComment] = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [result, setResult] = useState<{ efficiency: number; totalMinutes: number; normMinutes: number } | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const opIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeOpStartRef = useRef<number | null>(null)

  useEffect(() => {
    loadTask()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (opIntervalRef.current) clearInterval(opIntervalRef.current)
    }
  }, [taskId])

  const loadTask = async () => {
    try {
      const { data } = await api.get(`/tasks?workDayId=0`) // Нужно получить через отдельный endpoint
      // Временный workaround — используем прямой fetch
      const { data: t } = await api.get(`/tasks?workDayId=_all_`) // TODO: добавить GET /tasks/:id
      // Для простоты — сразу грузим весь рабочий день
    } catch (e) {}

    // Прямой запрос задания
    try {
      // Backend должен вернуть одно задание по ID — добавим этот эндпоинт ниже
      // Пока получаем через параметр
      const params = new URLSearchParams(window.location.search)
      const wdId = params.get('wdId') || sessionStorage.getItem('currentWdId')
      
      if (wdId) {
        const { data: tasks } = await api.get(`/tasks?workDayId=${wdId}`)
        const t = tasks.find((t: Task) => t.id === Number(taskId))
        if (t) initTask(t)
      } else {
        // Fallback: создаём запрос напрямую
        const { data } = await api.get(`/tasks/${taskId}`)
        initTask(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const initTask = (t: Task) => {
    setTask(t)
    const start = new Date(t.startedAt).getTime()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTaskElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Если есть незавершённая операция
    const running = t.operations.find(o => o.startedAt && !o.completedAt)
    if (running) {
      setActiveOpId(running.id)
      activeOpStartRef.current = new Date(running.startedAt!).getTime()
      if (opIntervalRef.current) clearInterval(opIntervalRef.current)
      opIntervalRef.current = setInterval(() => {
        if (activeOpStartRef.current) {
          setActiveOpElapsed(Math.floor((Date.now() - activeOpStartRef.current) / 1000))
        }
      }, 1000)
    }
  }

  const startOperation = async (type: OperationType, optional = false) => {
    if (activeOpId) return // стоп предыдущую сначала
    try {
      const { data } = await api.post('/operations', {
        taskId: Number(taskId),
        type,
        isOptional: optional,
      })
      setTask(prev => prev ? { ...prev, operations: [...prev.operations, data] } : prev)
      setActiveOpId(data.id)
      activeOpStartRef.current = new Date(data.startedAt).getTime()
      setActiveOpElapsed(0)
      if (opIntervalRef.current) clearInterval(opIntervalRef.current)
      opIntervalRef.current = setInterval(() => {
        if (activeOpStartRef.current) {
          setActiveOpElapsed(Math.floor((Date.now() - activeOpStartRef.current) / 1000))
        }
      }, 1000)
    } catch (e) {
      console.error(e)
    }
  }

  const stopOperation = async (opId: number) => {
    const op = task?.operations.find(o => o.id === opId)
    const isP = op?.type === 'PRINTING'
    try {
      const { data } = await api.put(`/operations/${opId}/stop`, {
        impressions: isP ? Number(impressions) || undefined : undefined,
      })
      setTask(prev => prev ? {
        ...prev,
        operations: prev.operations.map(o => o.id === opId ? data : o),
      } : prev)
      setActiveOpId(null)
      setActiveOpElapsed(0)
      activeOpStartRef.current = null
      if (opIntervalRef.current) clearInterval(opIntervalRef.current)
      if (isP) setImpressions('')
    } catch (e) {
      console.error(e)
    }
  }

  const completeTask = async () => {
    if (activeOpId) await stopOperation(activeOpId)
    setCompleting(true)
    try {
      const { data } = await api.put(`/tasks/${taskId}/complete`, { comment })
      setResult({
        efficiency: data.efficiency,
        totalMinutes: data.totalMinutes,
        normMinutes: data.normMinutes,
      })
      setTask(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCompleting(false)
      setShowComplete(false)
    }
  }

  const getOperationForType = (type: OperationType) =>
    task?.operations.find(o => o.type === type)

  const getNormLabel = (type: OperationType) => {
    const norm = norms.find(n => n.type === type)
    if (!norm) return ''
    if (norm.perUnit) {
      return `норма: ${norm.normSeconds}с / ${norm.perUnit} ${norm.unitLabel}`
    }
    return `норма: ${formatDuration(norm.normSeconds)}`
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center" style={{ color: 'var(--tg-theme-hint-color)' }}>
          Загрузка...
        </div>
      </div>
    )
  }

  if (result) {
    const effColor = result.efficiency >= 100 ? 'text-green-600' : result.efficiency >= 75 ? 'text-yellow-600' : 'text-red-600'
    const effBg = result.efficiency >= 100 ? 'bg-green-50' : result.efficiency >= 75 ? 'bg-yellow-50' : 'bg-red-50'

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-1">Задание выполнено!</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--tg-theme-hint-color)' }}>
          ТЗ № {task.taskNumber}
        </p>

        <div className={`w-full rounded-2xl p-6 ${effBg} mb-6 text-center`}>
          <div className={`text-5xl font-black mb-1 ${effColor}`}>
            {result.efficiency}%
          </div>
          <div className="font-semibold">Эффективность</div>
          <div className="text-sm mt-2" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Фактически: {result.totalMinutes} мин &nbsp;·&nbsp; По норме: {result.normMinutes} мин
          </div>
        </div>

        <button className="btn-primary" onClick={() => navigate(-1)}>
          ← Вернуться к дню
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: 'var(--tg-theme-bg-color)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl active:scale-95"
          style={{ background: 'var(--tg-theme-secondary-bg-color)' }}>
          ‹
        </button>
        <div className="flex-1">
          <div className="font-bold">ТЗ № {task.taskNumber}</div>
          {task.description && (
            <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{task.description}</div>
          )}
        </div>
        <div className="font-mono font-bold text-lg tabular-nums">
          {formatDuration(taskElapsed)}
        </div>
      </div>

      {/* Active operation timer */}
      {activeOpId && (
        <div className="mx-4 mb-3 rounded-2xl p-3 bg-blue-500 text-white flex items-center justify-between">
          <div>
            <div className="text-xs opacity-80">Выполняется</div>
            <div className="font-semibold text-sm">
              {OPERATIONS_ORDER.find(o => o.type === task.operations.find(op => op.id === activeOpId)?.type)?.label}
            </div>
          </div>
          <div className="font-mono font-bold text-xl tabular-nums">
            {formatDuration(activeOpElapsed)}
          </div>
        </div>
      )}

      {/* Operations */}
      <div className="px-4 flex flex-col gap-2">
        {OPERATIONS_ORDER.map(({ type, label, icon, optional }) => {
          const op = getOperationForType(type)
          const isActive = op && !op.completedAt && op.startedAt
          const isDone = op?.completedAt
          const isRunning = activeOpId === op?.id

          return (
            <div key={type} className="card">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                    {getNormLabel(type)}
                    {optional && ' · опционально'}
                  </div>
                  {isDone && op.durationSec && (
                    <div className="text-xs text-green-600 font-medium mt-0.5">
                      ✓ {formatDuration(op.durationSec)}
                      {op.type === 'PRINTING' && op.impressions ? ` · ${op.impressions} отт.` : ''}
                    </div>
                  )}
                </div>

                {!op ? (
                  <button
                    onClick={() => startOperation(type, optional)}
                    disabled={!!activeOpId}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                      activeOpId ? 'opacity-30' : ''
                    }`}
                    style={{
                      background: 'var(--tg-theme-button-color)',
                      color: 'var(--tg-theme-button-text-color)',
                    }}
                  >
                    Старт
                  </button>
                ) : isRunning ? (
                  <div className="flex flex-col items-end gap-1">
                    {type === 'PRINTING' && (
                      <input
                        type="number"
                        value={impressions}
                        onChange={e => setImpressions(e.target.value)}
                        placeholder="оттисков"
                        className="w-24 px-2 py-1 rounded-lg text-xs text-center border-0 outline-none"
                        style={{ background: 'var(--tg-theme-bg-color)' }}
                      />
                    )}
                    <button
                      onClick={() => stopOperation(op.id)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white active:scale-95 transition-all"
                    >
                      Стоп
                    </button>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Comment */}
        <div className="card mt-2">
          <div className="font-medium text-sm mb-2">💬 Комментарии</div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Добавьте комментарий к заданию..."
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm border-0 outline-none resize-none"
            style={{ background: 'var(--tg-theme-bg-color)' }}
          />
        </div>
      </div>

      {/* Complete button */}
      {task.status === 'IN_PROGRESS' && (
        <div className="fixed bottom-0 left-0 right-0 p-4"
          style={{ background: 'var(--tg-theme-bg-color)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <button
            className="btn-primary bg-green-500"
            onClick={() => setShowComplete(true)}
            disabled={completing}
          >
            ✅ Завершить задание
          </button>
        </div>
      )}

      {/* Confirm complete modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full rounded-t-3xl p-6" style={{ background: 'var(--tg-theme-bg-color)' }}>
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-center mb-2">Завершить задание?</h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--tg-theme-hint-color)' }}>
              Будет подсчитана эффективность по всем операциям
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowComplete(false)}>
                Отмена
              </button>
              <button
                className="btn-primary flex-1 bg-green-500"
                onClick={completeTask}
                disabled={completing}
              >
                {completing ? 'Подсчёт...' : 'Завершить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
