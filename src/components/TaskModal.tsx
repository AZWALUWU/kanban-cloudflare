import { useState, useEffect, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Task, ColumnId, Priority, ChecklistItem } from '../types'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { title: string; description: string; columnId?: ColumnId; priority: Priority; dueDate: string | null; checklist: ChecklistItem[] }) => Promise<void>
  initialTask?: Task | null
  targetColumn?: ColumnId
}

export function TaskModal({ isOpen, onClose, onSave, initialTask, targetColumn = 'todo' }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [columnId, setColumnId] = useState<ColumnId>('todo')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(initialTask?.title || '')
    setDescription(initialTask?.description || '')
    setColumnId(initialTask?.columnId || targetColumn)
    setPriority(initialTask?.priority || 'medium')
    setDueDate(initialTask?.dueDate || '')
    setChecklist(initialTask?.checklist || [])
    setError('')
  }, [initialTask, targetColumn, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Judul tugas wajib diisi.')
    setSubmitting(true)
    setError('')
    try {
      await onSave({ title: title.trim(), description, columnId, priority, dueDate: dueDate || null, checklist })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tugas.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4" onKeyDown={e => e.key === 'Escape' && onClose()}>
      <section className="my-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <header className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{initialTask ? 'Edit tugas' : 'Tugas baru'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup dialog" className="min-h-11 min-w-11 rounded-md text-slate-700 hover:bg-slate-100">Tutup</button>
        </header>
        {error && <p role="alert" className="mb-3 rounded border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label htmlFor="task-title" className="block text-sm font-medium">Judul</label><input id="task-title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-400 px-3" /></div>
          {!initialTask && <div><label htmlFor="task-column" className="block text-sm font-medium">Kolom</label><select id="task-column" value={columnId} onChange={e => setColumnId(e.target.value as ColumnId)} className="mt-1 min-h-11 w-full rounded-md border border-slate-400 px-3"><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label htmlFor="task-priority" className="block text-sm font-medium">Prioritas</label><select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as Priority)} className="mt-1 min-h-11 w-full rounded-md border border-slate-400 px-3"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><div><label htmlFor="task-due" className="block text-sm font-medium">Tenggat</label><input id="task-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-400 px-3" /></div></div>
          <div><div className="mb-1 flex items-center justify-between"><label htmlFor="task-description" className="text-sm font-medium">Deskripsi (Markdown)</label><button type="button" onClick={() => setPreview(!preview)} className="min-h-11 px-3 text-sm text-blue-800 underline">{preview ? 'Edit' : 'Pratinjau'}</button></div>{preview ? <article className="prose min-h-24 max-w-none rounded border border-slate-300 p-3"><ReactMarkdown>{description}</ReactMarkdown></article> : <textarea id="task-description" rows={4} maxLength={10000} value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-slate-400 p-3" />}</div>
          <fieldset><legend className="text-sm font-medium">Checklist</legend><ul className="my-2 space-y-2">{checklist.map((item, i) => <li key={item.id || i} className="flex items-center gap-2"><input aria-label={`Selesai: ${item.text}`} type="checkbox" checked={item.completed} onChange={e => setChecklist(checklist.map((x, n) => n === i ? { ...x, completed: e.target.checked } : x))} className="h-5 w-5" /><span className="min-w-0 flex-1 break-words">{item.text}</span><button type="button" onClick={() => setChecklist(checklist.filter((_, n) => n !== i))} aria-label={`Hapus ${item.text}`} className="min-h-11 px-2 text-red-800 underline">Hapus</button></li>)}</ul><div className="flex gap-2"><label className="sr-only" htmlFor="checklist-new">Item checklist baru</label><input id="checklist-new" value={newItem} onChange={e => setNewItem(e.target.value)} maxLength={300} className="min-h-11 min-w-0 flex-1 rounded border border-slate-400 px-3" /><button type="button" disabled={!newItem.trim() || checklist.length >= 50} onClick={() => { setChecklist([...checklist, { text: newItem.trim(), completed: false }]); setNewItem('') }} className="min-h-11 rounded border border-slate-400 px-3 disabled:opacity-50">Tambah item</button></div></fieldset>
          <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={onClose} disabled={submitting} className="min-h-11 rounded border border-slate-400 px-4">Batal</button><button type="submit" disabled={submitting} className="min-h-11 rounded bg-blue-800 px-4 font-semibold text-white hover:bg-blue-900 disabled:opacity-50">{submitting ? 'Menyimpan…' : 'Simpan tugas'}</button></footer>
        </form>
      </section>
    </div>
  )
}
