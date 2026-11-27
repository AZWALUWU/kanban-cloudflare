import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import type { Task, ColumnId, User, Board, Priority } from '../types'
import { moveTask } from '../../functions/lib/position'
import { Column } from './Column'
import { TaskModal } from './TaskModal'

interface KanbanBoardProps { user: User; onLogout: () => void }
const COLUMNS: Array<{ id: ColumnId; title: string }> = [
  { id: 'todo', title: 'To Do' }, { id: 'in_progress', title: 'In Progress' }, { id: 'done', title: 'Done' },
]

export function KanbanBoard({ user, onLogout }: KanbanBoardProps) {
  const [boards, setBoards] = useState<Board[]>([])
  const [boardId, setBoardId] = useState('')
  const [boardName, setBoardName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [targetColumn, setTargetColumn] = useState<ColumnId>('todo')
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')

  const api = useCallback((path: string) => `/api/boards/${boardId}${path}`, [boardId])
  const fetchBoards = useCallback(async () => {
    const res = await fetch('/api/boards')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal memuat board.')
    setBoards(data.boards)
    setBoardId(current => current && data.boards.some((board: Board) => board.id === current) ? current : data.boards[0]?.id || '')
  }, [])
  const fetchTasks = useCallback(async () => {
    if (!boardId) return
    setLoading(true)
    try {
      const res = await fetch(api('/tasks'))
      if (res.status === 401) return onLogout()
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengambil tugas.')
      setTasks(data.tasks)
      setError('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Koneksi gagal.') }
    finally { setLoading(false) }
  }, [api, boardId, onLogout])

  useEffect(() => { fetchBoards().catch(e => setError(e.message)) }, [fetchBoards])
  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createBoard(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/boards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: boardName }) })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setBoards(prev => [...prev, data.board]); setBoardId(data.board.id); setBoardName('')
  }
  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(api('/invites'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail }) })
    const data = await res.json()
    setError(res.ok ? `Anggota ${inviteEmail} ditambahkan.` : data.error)
    if (res.ok) setInviteEmail('')
  }
  function handleOpenAdd(colId: ColumnId) { setEditingTask(null); setTargetColumn(colId); setModalOpen(true) }
  function handleOpenEdit(task: Task) { setEditingTask(task); setModalOpen(true) }

  async function handleSaveTask(data: { title: string; description: string; columnId?: ColumnId; priority: Priority; dueDate: string | null; checklist: NonNullable<Task['checklist']> }) {
    const editing = Boolean(editingTask)
    const res = await fetch(api(editing ? `/tasks/${editingTask!.id}` : '/tasks'), {
      method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Gagal menyimpan tugas.')
    if (editing) await fetchTasks()
    else setTasks(prev => [...prev, result.task])
  }
  async function handleDeleteTask(id: string) {
    if (!window.confirm('Hapus tugas ini?')) return
    const previous = tasks
    setTasks(current => current.filter(task => task.id !== id))
    const res = await fetch(api(`/tasks/${id}`), { method: 'DELETE' })
    if (!res.ok) { setTasks(previous); setError('Gagal menghapus tugas. Coba lagi.') }
  }
  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return
    const to = destination.droppableId as ColumnId
    const previous = tasks
    const moved = moveTask(tasks, draggableId, to, destination.index)
    if (!moved) return
    setTasks(tasks.map(task => task.id === moved.id ? moved : task))
    const res = await fetch(api('/tasks/reorder'), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(moved) })
    if (!res.ok) { setTasks(previous); setError('Perubahan urutan gagal disimpan.') }
  }

  const visibleTasks = tasks.filter(task => task.title.toLowerCase().includes(query.toLowerCase()) && (priorityFilter === 'all' || task.priority === priorityFilter))
  const activeBoard = boards.find(board => board.id === boardId)
  return <div className="min-h-screen flex flex-col">
    <header className="border-b border-slate-300 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div><h1 className="text-lg font-bold text-slate-900">TaskFlow</h1><p className="text-sm text-slate-700">{user.email}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="board-select">Board</label><select id="board-select" value={boardId} onChange={e => setBoardId(e.target.value)} className="min-h-11 max-w-48 rounded border border-slate-400 px-2">{boards.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}</select>
        <button type="button" onClick={() => handleOpenAdd('todo')} className="min-h-11 rounded bg-blue-800 px-3 font-semibold text-white hover:bg-blue-900">Tambah tugas</button>
        <button type="button" onClick={onLogout} className="min-h-11 rounded border border-slate-400 px-3 font-semibold hover:bg-slate-100">Keluar</button>
      </div>
    </div></header>
    <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
      {error && <div role="status" className="mb-4 border border-slate-400 bg-white p-3 text-slate-900">{error}<button type="button" onClick={() => setError('')} className="ml-3 underline">Tutup</button></div>}
      <div className="mb-4 flex flex-wrap gap-3">
        <form onSubmit={createBoard} className="flex gap-2"><label className="sr-only" htmlFor="new-board">Nama board baru</label><input id="new-board" value={boardName} onChange={e => setBoardName(e.target.value)} placeholder="Nama board" maxLength={80} className="min-h-11 rounded border border-slate-400 px-3" /><button className="min-h-11 rounded border border-slate-400 px-3">Buat board</button></form>
        {activeBoard?.role === 'owner' && <form onSubmit={inviteMember} className="flex gap-2"><label className="sr-only" htmlFor="invite-email">Email anggota yang sudah terdaftar</label><input id="invite-email" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email anggota terdaftar" className="min-h-11 min-w-0 rounded border border-slate-400 px-3" /><button className="min-h-11 rounded border border-slate-400 px-3">Undang anggota</button></form>}
      </div>
      <div className="mb-4 flex flex-wrap gap-3"><label className="sr-only" htmlFor="task-search">Cari judul tugas</label><input id="task-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari judul tugas" className="min-h-11 min-w-0 rounded border border-slate-400 px-3" /><label className="sr-only" htmlFor="priority-filter">Filter prioritas</label><select id="priority-filter" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | 'all')} className="min-h-11 rounded border border-slate-400 px-3"><option value="all">Semua prioritas</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
      {loading ? <p role="status" className="py-12 text-center">Memuat tugas board…</p> : <DragDropContext onDragEnd={handleDragEnd}><div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">{COLUMNS.map(col => <Column key={col.id} id={col.id} title={col.title} tasks={visibleTasks.filter(task => task.columnId === col.id).sort((a,b) => a.position-b.position)} onAddTask={handleOpenAdd} onEditTask={handleOpenEdit} onDeleteTask={handleDeleteTask} />)}</div></DragDropContext>}
      {!loading && visibleTasks.length === 0 && <p className="mt-4 text-center text-slate-800">{tasks.length ? 'Tidak ada tugas yang cocok dengan pencarian/filter.' : 'Board ini belum memiliki tugas. Tambahkan tugas pertama.'}</p>}
      <p className="mt-4 text-sm text-slate-700">{activeBoard?.role === 'owner' ? 'Peran: Owner' : 'Peran: Member'}</p>
    </main>
    <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveTask} initialTask={editingTask} targetColumn={targetColumn} />
  </div>
}
