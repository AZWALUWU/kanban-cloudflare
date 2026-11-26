import { useState, useEffect, type FormEvent } from 'react'
import type { Task, ColumnId } from '../types'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string; description: string; columnId?: ColumnId }) => Promise<void>
  initialTask?: Task | null
  targetColumn?: ColumnId
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  targetColumn = 'todo',
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState<ColumnId>('todo')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title)
      setDescription(initialTask.description || '')
      setColumnId(initialTask.columnId)
    } else {
      setTitle('')
      setDescription('')
      setColumnId(targetColumn)
    }
    setError('')
  }, [initialTask, targetColumn, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Judul tugas tidak boleh kosong.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        columnId,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan tugas.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <header className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
            {initialTask ? 'Perbarui Tugas' : 'Tambah Tugas Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela modal"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700">
              Judul Tugas
            </label>
            <input
              id="task-title"
              type="text"
              required
              autoFocus
              placeholder="Contoh: Buat integrasi API login"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {!initialTask && (
            <div>
              <label htmlFor="task-column" className="block text-sm font-medium text-slate-700">
                Pilih Kolom
              </label>
              <select
                id="task-column"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value as ColumnId)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-slate-700">
              Deskripsi Catatan (Opsional)
            </label>
            <textarea
              id="task-description"
              rows={4}
              placeholder="Tuliskan rincian atau catatan tugas ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Menyimpan...' : initialTask ? 'Simpan Perubahan' : 'Buat Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
