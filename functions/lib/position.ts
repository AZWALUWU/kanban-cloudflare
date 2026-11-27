export function fractionalPosition(before?: number, after?: number) {
  if (before === undefined && after === undefined) return 0
  if (before === undefined) return after! - 1
  if (after === undefined) return before + 1
  return before + (after - before) / 2
}

export function moveTask<T extends { id: string; columnId: string; position: number }>(
  tasks: T[], id: string, columnId: string, index: number,
) {
  const moved = tasks.find(task => task.id === id)
  if (!moved) return null
  const source = tasks.filter(task => task.columnId === moved.columnId && task.id !== id).sort((a, b) => a.position - b.position)
  const target = moved.columnId === columnId ? source : tasks.filter(task => task.columnId === columnId).sort((a, b) => a.position - b.position)
  if (index < 0 || index > target.length) return null
  const before = target[index - 1]?.position
  const after = target[index]?.position
  const position = fractionalPosition(before, after)
  if (!Number.isFinite(position) || position === before || position === after) return null
  return { ...moved, columnId, position }
}
