import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, asc, sql } from 'drizzle-orm'
import { users, tasks, boards, boardMembers, columns, taskChecklists } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { boardSchema, emailSchema, passwordSchema, reorderSchema, taskSchema } from '../lib/validation'
import { fractionalPosition } from '../lib/position'
import { z } from 'zod'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  SESSIONS?: KVNamespace
}

type Variables = {
  userId: string
  userEmail: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api')
const sessionSecret = (c: { env: Bindings }) => c.env.JWT_SECRET

app.use('/boards', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  const secret = sessionSecret(c)
  if (!token || !secret) return c.json({ error: 'Sesi tidak valid.' }, 401)
  try {
    const payload = (await verify(token, secret, 'HS256')) as { userId: string; email: string; jti: string }
    if (c.env.SESSIONS && !await c.env.SESSIONS.get(`session:${payload.jti}`)) return c.json({ error: 'Sesi telah dicabut.' }, 401)
    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Sesi kadaluarsa atau tidak valid.' }, 401)
  }
})
app.use('/boards/:boardId/*', async (c, next) => {
  const token = getCookie(c, 'auth_token')
  const secret = sessionSecret(c)
  if (!token || !secret) return c.json({ error: 'Sesi tidak valid.' }, 401)
  try {
    const payload = (await verify(token, secret, 'HS256')) as { userId: string; email: string; jti: string }
    if (c.env.SESSIONS && !await c.env.SESSIONS.get(`session:${payload.jti}`)) return c.json({ error: 'Sesi telah dicabut.' }, 401)
    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Sesi kadaluarsa atau tidak valid.' }, 401)
  }
})
app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'Permintaan gagal diproses.' }, 500)
})

// === AUTH ROUTES ===

app.post('/auth/register', async (c) => {
  const db = drizzle(c.env.DB)
  const secret = sessionSecret(c)
  if (!secret) return c.json({ error: 'Server session secret is not configured.' }, 500)
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))
  const credentials = z.object({ email: emailSchema, password: passwordSchema }).safeParse(body)
  if (!credentials.success) return c.json({ error: 'Email tidak valid atau kata sandi harus 8-128 karakter.' }, 400)
  const { email, password } = credentials.data

  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    return c.json({ error: 'Email sudah terdaftar.' }, 409)
  }

  const { hash, salt } = await hashPassword(password)
  const userId = crypto.randomUUID()

  const boardId = crypto.randomUUID()
  await db.batch([
    db.insert(users).values({ id: userId, email, passwordHash: hash, salt }),
    db.insert(boards).values({ id: boardId, name: 'My Tasks' }),
    db.insert(boardMembers).values({ boardId, userId, role: 'owner' }),
    db.insert(columns).values([
    { id: 'todo', boardId, name: 'To Do', position: 0 },
    { id: 'in_progress', boardId, name: 'In Progress', position: 1 },
    { id: 'done', boardId, name: 'Done', position: 2 },
    ]),
  ])


  const jti = crypto.randomUUID()
  const token = await sign(
    { userId, email, jti, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret,
    'HS256'
  )
  if (c.env.SESSIONS) await c.env.SESSIONS.put(`session:${jti}`, userId, { expirationTtl: 60 * 60 * 24 * 7 })

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ user: { id: userId, email } }, 201)
})

app.post('/auth/login', async (c) => {
  const db = drizzle(c.env.DB)
  const secret = sessionSecret(c)
  if (!secret) return c.json({ error: 'Server session secret is not configured.' }, 500)
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))
  const credentials = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).safeParse(body)
  if (!credentials.success) return c.json({ error: 'Email atau kata sandi tidak valid.' }, 400)
  const { email, password } = credentials.data

  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) {
    return c.json({ error: 'Email atau password salah.' }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash, user.salt)
  if (!valid) {
    return c.json({ error: 'Email atau password salah.' }, 401)
  }

  const jti = crypto.randomUUID()
  const token = await sign(
    { userId: user.id, email: user.email, jti, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret,
    'HS256'
  )
  if (c.env.SESSIONS) await c.env.SESSIONS.put(`session:${jti}`, user.id, { expirationTtl: 60 * 60 * 24 * 7 })

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ user: { id: user.id, email: user.email } })
})

app.post('/auth/logout', async (c) => {
  const token = getCookie(c, 'auth_token')
  const secret = sessionSecret(c)
  if (token && c.env.SESSIONS && secret) {
    try {
      const payload = (await verify(token, secret, 'HS256')) as { jti: string }
      await c.env.SESSIONS.delete(`session:${payload.jti}`)
    } catch {}
  }
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ success: true })
})

app.get('/auth/me', async (c) => {
  const secret = sessionSecret(c)
  const token = getCookie(c, 'auth_token')

  if (!token || !secret) {
    return c.json({ user: null })
  }

  try {
    const payload = (await verify(token, secret, 'HS256')) as { userId: string; email: string; jti: string }
    if (c.env.SESSIONS && !await c.env.SESSIONS.get(`session:${payload.jti}`)) return c.json({ user: null })
    return c.json({ user: { id: payload.userId, email: payload.email } })
  } catch {
    return c.json({ user: null })
  }
})

// === TASKS CRUD & REORDER ROUTES ===

async function boardRole(db: ReturnType<typeof drizzle>, boardId: string, userId: string) {
  return db.select({ role: boardMembers.role }).from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId))).get()
}

app.get('/boards', async (c) => {
  const db = drizzle(c.env.DB)
  const list = await db.select({ id: boards.id, name: boards.name, role: boardMembers.role })
    .from(boardMembers).innerJoin(boards, eq(boards.id, boardMembers.boardId))
    .where(eq(boardMembers.userId, c.get('userId')))
  return c.json({ boards: list })
})

app.post('/boards', async (c) => {
  const parsed = boardSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Nama board harus 1-80 karakter.' }, 400)
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')
  const boardId = crypto.randomUUID()
  await db.batch([
    db.insert(boards).values({ id: boardId, name: parsed.data.name }),
    db.insert(boardMembers).values({ boardId, userId, role: 'owner' }),
    db.insert(columns).values([
      { id: 'todo', boardId, name: 'To Do', position: 0 },
      { id: 'in_progress', boardId, name: 'In Progress', position: 1 },
      { id: 'done', boardId, name: 'Done', position: 2 },
    ]),
  ])
  return c.json({ board: { id: boardId, name: parsed.data.name, role: 'owner' } }, 201)
})

app.post('/boards/:boardId/invites', async (c) => {
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  const userId = c.get('userId')
  const owner = await boardRole(db, boardId, userId)
  if (owner?.role !== 'owner') return c.json({ error: 'Hanya owner yang dapat mengundang anggota.' }, 403)
  const parsed = z.object({ email: emailSchema }).safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Email tidak valid.' }, 400)
  const invitee = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).get()
  if (!invitee) return c.json({ error: 'Email belum terdaftar. Pengguna harus membuat akun terlebih dahulu.' }, 404)
  await db.insert(boardMembers).values({ boardId, userId: invitee.id, role: 'member', invitedBy: userId }).onConflictDoNothing()
  return c.json({ success: true })
})

app.get('/boards/:boardId/members', async (c) => {
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  if (!await boardRole(db, boardId, c.get('userId'))) return c.json({ error: 'Akses ditolak.' }, 403)
  const members = await db.select({ userId: users.id, email: users.email, role: boardMembers.role })
    .from(boardMembers).innerJoin(users, eq(users.id, boardMembers.userId))
    .where(eq(boardMembers.boardId, boardId))
  return c.json({ members })
})

app.get('/boards/:boardId/tasks', async (c) => {
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  if (!await boardRole(db, boardId, c.get('userId'))) return c.json({ error: 'Akses ditolak.' }, 403)
  const list = await db.select().from(tasks).where(eq(tasks.boardId, boardId)).orderBy(asc(tasks.position))
  const withChecklist = await Promise.all(list.map(async task => ({
    ...task,
    checklist: await db.select().from(taskChecklists).where(eq(taskChecklists.taskId, task.id)).orderBy(asc(taskChecklists.position)),
  })))
  return c.json({ tasks: withChecklist })
})

app.post('/boards/:boardId/tasks', async (c) => {
  const parsed = taskSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message || 'Data tugas tidak valid.' }, 400)
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  const userId = c.get('userId')
  if (!await boardRole(db, boardId, userId)) return c.json({ error: 'Akses ditolak.' }, 403)
  const { title, description, columnId, priority, dueDate, checklist } = parsed.data
  const last = await db.select({ position: tasks.position }).from(tasks)
    .where(and(eq(tasks.boardId, boardId), eq(tasks.columnId, columnId)))
    .orderBy(sql`${tasks.position} DESC`).get()
  const taskId = crypto.randomUUID()
  await db.insert(tasks).values({ id: taskId, boardId, createdBy: userId, columnId, title, description, priority, dueDate: dueDate ?? null, position: fractionalPosition(last?.position) })
  if (checklist.length) await db.insert(taskChecklists).values(checklist.map((item, i) => ({ id: crypto.randomUUID(), taskId, text: item.text, completed: item.completed, position: i })))
  return c.json({ task: { id: taskId, boardId, createdBy: userId, ...parsed.data, position: fractionalPosition(last?.position) } }, 201)
})

app.put('/boards/:boardId/tasks/:id', async (c) => {
  const parsed = taskSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message || 'Data tugas tidak valid.' }, 400)
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  if (!await boardRole(db, boardId, c.get('userId'))) return c.json({ error: 'Akses ditolak.' }, 403)
  const id = c.req.param('id')
  const existing = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.boardId, boardId))).get()
  if (!existing) return c.json({ error: 'Tugas tidak ditemukan.' }, 404)
  const { title, description, priority, dueDate, checklist } = parsed.data
  await db.batch([
    db.update(tasks).set({ title, description, priority, dueDate: dueDate ?? null, updatedAt: sql`(unixepoch())` }).where(and(eq(tasks.id, id), eq(tasks.boardId, boardId))),
    db.delete(taskChecklists).where(eq(taskChecklists.taskId, id)),
    ...(checklist.length ? [db.insert(taskChecklists).values(checklist.map((item, i) => ({ id: crypto.randomUUID(), taskId: id, text: item.text, completed: item.completed, position: i })))] : []),
  ])
  return c.json({ success: true })
})

app.delete('/boards/:boardId/tasks/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  if (!await boardRole(db, boardId, c.get('userId'))) return c.json({ error: 'Akses ditolak.' }, 403)
  await db.delete(tasks).where(and(eq(tasks.id, c.req.param('id')), eq(tasks.boardId, boardId)))
  return c.json({ success: true })
})

app.patch('/boards/:boardId/tasks/reorder', async (c) => {
  const parsed = reorderSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Urutan kartu tidak valid.' }, 400)
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  if (!await boardRole(db, boardId, c.get('userId'))) return c.json({ error: 'Akses ditolak.' }, 403)
  const existing = await db.select({ id: tasks.id }).from(tasks)
    .where(and(eq(tasks.boardId, boardId), eq(tasks.id, parsed.data.id))).get()
  if (!existing) return c.json({ error: 'Tugas tidak ditemukan di board ini.' }, 404)
  await db.update(tasks).set({ columnId: parsed.data.columnId, position: parsed.data.position, updatedAt: sql`(unixepoch())` })
    .where(and(eq(tasks.id, parsed.data.id), eq(tasks.boardId, boardId)))
  return c.json({ success: true })
})

app.delete('/boards/:boardId/members/:memberId', async (c) => {
  const db = drizzle(c.env.DB)
  const boardId = c.req.param('boardId')
  const userId = c.get('userId')
  if ((await boardRole(db, boardId, userId))?.role !== 'owner') return c.json({ error: 'Hanya owner yang dapat mengelola anggota.' }, 403)
  if (userId === c.req.param('memberId')) return c.json({ error: 'Owner tidak dapat menghapus dirinya sendiri.' }, 400)
  await db.delete(boardMembers).where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, c.req.param('memberId'))))
  return c.json({ success: true })
})

export const onRequest: PagesFunction<Bindings> = async (context) => {
  return app.fetch(context.request, context.env, context)
}
