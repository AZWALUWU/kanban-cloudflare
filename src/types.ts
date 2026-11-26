export type ColumnId = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  userId?: string
  columnId: ColumnId
  title: string
  description?: string
  position: number
  createdAt?: number
  updatedAt?: number
}

export interface User {
  id: string
  email: string
}
