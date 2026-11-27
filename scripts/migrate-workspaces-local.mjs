import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
const migration = fs.readFileSync('migrations/0001_workspaces.sql', 'utf8')
if (!fs.existsSync(dir)) throw new Error('Local D1 directory not found; run the app locally once first.')
for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.sqlite') && file !== 'metadata.sqlite')) {
  const db = new DatabaseSync(`${dir}/${file}`)
  try {
    const tables = () => db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name)
    const names = tables()
    if (!names.includes('users') || !names.includes('tasks')) continue
    if (names.includes('boards') && db.prepare('PRAGMA table_info(tasks)').all().some(row => row.name === 'board_id')) continue
    db.exec('PRAGMA foreign_keys=OFF')
    db.exec(migration)
    db.exec('PRAGMA foreign_keys=ON')
    console.log(`Reset ${file}; created empty workspaces for ${db.prepare('SELECT COUNT(*) AS count FROM users').get().count} users`)
  } finally { db.close() }
}
