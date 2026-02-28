// frontend/src/types/index.ts

export type Role = 'ADMIN' | 'MANAGER' | 'WORKER'
export type DayType = 'WORK' | 'DAY_OFF'
export type TaskStatus = 'IN_PROGRESS' | 'COMPLETED'

export type OperationType =
  | 'EMULSION_POUR'
  | 'EXPOSURE'
  | 'DRYING'
  | 'FIXING'
  | 'SETUP_SEMIAUTO'
  | 'SETUP_MANUAL'
  | 'PRINTING'
  | 'WASHING'
  | 'INK_MIXING'
  | 'SCREEN_WASHING'

export interface User {
  id: number
  telegramId: string
  username?: string
  firstName: string
  lastName?: string
  role: Role
}

export interface WorkDay {
  id: number
  date: string
  type: DayType
  startedAt?: string
  endedAt?: string
  tasksCount?: number
}

export interface OperationNorm {
  type: OperationType
  label: string
  normSeconds: number
  perUnit?: number
  unitLabel?: string
  description?: string
}

export interface Operation {
  id: number
  taskId: number
  type: OperationType
  isOptional: boolean
  startedAt?: string
  completedAt?: string
  durationSec?: number
  impressions?: number
  comment?: string
  norm?: OperationNorm
}

export interface Task {
  id: number
  workDayId: number
  taskNumber: string
  description?: string
  status: TaskStatus
  startedAt: string
  completedAt?: string
  totalMinutes?: number
  normMinutes?: number
  efficiency?: number
  operations: Operation[]
}
