import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import type { Task, ColumnId, User } from '../types'
import { Column } from './Column'
import { TaskModal } from './TaskModal'

interface KanbanBoardProps {
  user: User
  onLogout: () => void
}

const COLUMNS: Array<{ id: ColumnId; title: string }> = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export function KanbanBoard({ user, onLogout }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [targetColumn, setTargetColumn] = useState<ColumnId>('todo')

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.status === 401) {
        onLogout()
        return
      }
      const data = await res.json()
      if (res.ok) {
        setTasks(data.tasks || [])
      } else {
        setError(data.error || 'Gagal mengambil daftar tugas.')
      }
    } catch {
      setError('Koneksi ke server terputus saat mengambil tugas.')
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  function handleOpenAdd(colId: ColumnId) {
    setEditingTask(null)
    setTargetColumn(colId)
    setModalOpen(true)
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  async function handleSaveTask(data: { title: string; description: string; columnId?: ColumnId }) {
    if (editingTask) {
      // Edit task
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title, description: data.description }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal memperbarui tugas.')
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title: data.title, description: data.description }
            : t
        )
      )
    } else {
      // Create new task
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          columnId: data.columnId || targetColumn,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal membuat tugas baru.')
      }
      const result = await res.json()
      setTasks((prev) => [...prev, result.task])
    }
  }

  async function handleDeleteTask(id: string) {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) return

    // Optimistic remove
    const original = [...tasks]
    setTasks((prev) => prev.filter((t) => t.id !== id))

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setTasks(original)
        alert('Gagal menghapus tugas dari server.')
      }
    } catch {
      setTasks(original)
      alert('Terjadi kesalahan jaringan saat menghapus.')
    }
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceColId = source.droppableId as ColumnId
    const destColId = destination.droppableId as ColumnId

    // Copy list & optimistic update
    const prevTasks = [...tasks]
    const updated = [...tasks]
    const draggedItem = updated.find((t) => t.id === draggableId)
    if (!draggedItem) return

    // Reconstruct column arrays
    const sourceList = updated
      .filter((t) => t.columnId === sourceColId && t.id !== draggableId)
      .sort((a, b) => a.position - b.position)

    const destList =
      sourceColId === destColId
        ? sourceList
        : updated
            .filter((t) => t.columnId === destColId)
            .sort((a, b) => a.position - b.position)

    // Insert into destination index
    const updatedDraggedItem = { ...draggedItem, columnId: destColId }
    destList.splice(destination.index, 0, updatedDraggedItem)

    // Re-index positions
    const reorderedItems: Array<{ id: string; columnId: ColumnId; position: number }> = []

    destList.forEach((item, idx) => {
      item.position = idx
      reorderedItems.push({ id: item.id, columnId: destColId, position: idx })
    })

    if (sourceColId !== destColId) {
      sourceList.forEach((item, idx) => {
        item.position = idx
        reorderedItems.push({ id: item.id, columnId: sourceColId, position: idx })
      })
    }

    // Merge back into state
    const unaffected = updated.filter(
      (t) => t.columnId !== sourceColId && t.columnId !== destColId
    )
    const newCombined =
      sourceColId === destColId
        ? [...unaffected, ...destList]
        : [...unaffected, ...sourceList, ...destList]

    setTasks(newCombined)

    // Persist reorder to Cloudflare D1
    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reorderedItems }),
      })
      if (!res.ok) {
        setTasks(prevTasks)
      }
    } catch {
      setTasks(prevTasks)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              KB
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Papan Kanban Tugas
              </h1>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAdd('todo')}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 min-h-[38px]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Tambah Tugas</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 min-h-[38px]"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm font-medium text-slate-500">Memuat papan tugas...</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto pb-6">
              {COLUMNS.map((col) => {
                const columnTasks = tasks
                  .filter((t) => t.columnId === col.id)
                  .sort((a, b) => a.position - b.position)

                return (
                  <Column
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tasks={columnTasks}
                    onAddTask={handleOpenAdd}
                    onEditTask={handleOpenEdit}
                    onDeleteTask={handleDeleteTask}
                  />
                )
              })}
            </div>
          </DragDropContext>
        )}
      </main>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        targetColumn={targetColumn}
      />
    </div>
  )
}
