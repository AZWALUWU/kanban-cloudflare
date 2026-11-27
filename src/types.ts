export type ColumnId = 'todo' | 'in_progress' | 'done'

export type Priority = 'low' | 'medium' | 'high'

export interface ChecklistItem {
  id?: string
  text: string
  completed: boolean
}

export interface Task {
  id: string
  boardId: string
  createdBy?: string
  columnId: ColumnId
  title: string
  description?: string
  priority: Priority
  dueDate?: string | null
  checklist?: ChecklistItem[]
  position: number
  createdAt?: number
  updatedAt?: number
}

export interface Board {
  id: string
  name: string
  role: 'owner' | 'member'
}


export interface User {
  id: string
  email: string
}
