import { Droppable, Draggable } from '@hello-pangea/dnd'
import type { Task, ColumnId } from '../types'
import { TaskCard } from './TaskCard'

interface ColumnProps {
  id: ColumnId
  title: string
  tasks: Task[]
  onAddTask: (columnId: ColumnId) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
}

export function Column({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-100/70 p-3 md:p-4 min-w-[280px] md:min-w-0">
      <header className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
            {title}
          </h2>
          <span
            aria-label={`${tasks.length} tugas`}
            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700"
          >
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(id)}
          aria-label={`Tambah tugas baru di kolom ${title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
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
        </button>
      </header>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2.5 rounded-lg p-1 transition-colors duration-150 min-h-[120px] ${
              snapshot.isDraggingOver ? 'bg-slate-200/50' : ''
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-4 text-center">
                <p className="text-xs text-slate-500">Belum ada tugas di kolom ini.</p>
                <button
                  type="button"
                  onClick={() => onAddTask(id)}
                  className="mt-2 text-xs font-medium text-blue-600 hover:underline min-h-[36px] flex items-center"
                >
                  Tambah tugas
                </button>
              </div>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(providedDraggable, snapshotDraggable) => (
                  <TaskCard
                    task={task}
                    index={index}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    providedDraggable={providedDraggable}
                    isDragging={snapshotDraggable.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
