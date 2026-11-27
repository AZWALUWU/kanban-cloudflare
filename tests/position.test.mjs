import assert from 'node:assert/strict'
import { fractionalPosition, moveTask } from '../functions/lib/position.ts'

assert.equal(fractionalPosition(), 0)
assert.equal(fractionalPosition(undefined, 4), 3)
assert.equal(fractionalPosition(4), 5)
assert.equal(fractionalPosition(4, 6), 5)
assert.equal(fractionalPosition(4, 5), 4.5)
const tasks = [{ id: 'a', columnId: 'todo', position: 0 }, { id: 'b', columnId: 'todo', position: 1 }, { id: 'c', columnId: 'done', position: 0 }]
assert.deepEqual(moveTask(tasks, 'b', 'todo', 0), { ...tasks[1], position: -1 })
assert.deepEqual(moveTask(tasks, 'b', 'done', 1), { ...tasks[1], columnId: 'done', position: 1 })
assert.equal(moveTask(tasks, 'missing', 'todo', 0), null)
