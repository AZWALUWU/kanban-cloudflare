import type { Task } from '../types'
import ReactMarkdown from 'react-markdown'

interface TaskCardProps {
  task: Task
  index: number
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  providedDraggable: any
  isDragging: boolean
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  providedDraggable,
  isDragging,
}: TaskCardProps) {
  return (
    <div
      ref={providedDraggable.innerRef}
      {...providedDraggable.draggableProps}
      {...providedDraggable.dragHandleProps}
      className={`group relative rounded-lg border bg-white p-4 shadow-2xs transition-shadow duration-150 ${
        isDragging
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
          {task.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            title="Edit tugas"
            aria-label={`Edit tugas ${task.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title="Hapus tugas"
            aria-label={`Hapus tugas ${task.title}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
        <span className={task.priority === 'high' ? 'text-red-800' : task.priority === 'low' ? 'text-slate-700' : 'text-amber-800'}>Prioritas: {task.priority}</span>
        {task.dueDate && <time dateTime={task.dueDate} className="text-slate-700">Tenggat: {task.dueDate}</time>}
        {!!task.checklist?.length && <span className="text-slate-700">Checklist: {task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span>}
      </div>
      {task.description && <div className="prose prose-sm mt-2 max-w-none text-slate-800 line-clamp-3"><ReactMarkdown>{task.description}</ReactMarkdown></div>}
    </div>
  )
}
