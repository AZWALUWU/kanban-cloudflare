import fs from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const dir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
const sql = fs.readFileSync('migrations/0000_init.sql', 'utf8')

if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
  for (const file of files) {
    const dbPath = `${dir}/${file}`
    const db = new DatabaseSync(dbPath)
    db.exec(sql)
    console.log(`Migrated ${file}`)
  }
}
