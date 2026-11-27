import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync(':memory:')
db.exec(readFileSync('migrations/0000_init.sql', 'utf8'))
db.prepare('INSERT INTO users (id, email, password_hash, salt) VALUES (?, ?, ?, ?)').run('u1', 'a@example.com', 'hash', 'salt')
db.prepare('INSERT INTO tasks (id, user_id, column_id, title, description, position) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 'u1', 'todo', 'Existing task', 'Keep me', 7)
db.exec(readFileSync('migrations/0001_workspaces.sql', 'utf8'))
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count, 0)
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM boards').get().count, 1)
assert.equal(db.prepare('SELECT role FROM board_members WHERE user_id=?').get('u1').role, 'owner')
assert.equal(db.prepare('SELECT count(*) AS n FROM columns WHERE board_id=(SELECT id FROM boards)').get().n, 3)
db.close()
