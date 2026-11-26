import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'
import { drizzle } from 'drizzle-orm/d1'
import { eq, and, asc, sql } from 'drizzle-orm'
import { users, tasks } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/crypto'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  userId: string
  userEmail: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api')

// Auth Middleware: validates session cookie or Authorization header
app.use('/tasks/*', async (c, next) => {
  const secret = c.env.JWT_SECRET || 'dev-secret-key-kanban-board-change-in-prod'
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Sesi tidak ditemukan. Silakan login kembali.' }, 401)
  }

  try {
    const payload = (await verify(token, secret, 'HS256')) as { userId: string; email: string }
    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
    await next()
  } catch {
    return c.json({ error: 'Sesi kadaluarsa atau tidak valid.' }, 401)
  }
})

// === AUTH ROUTES ===

app.post('/auth/register', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password || password.length < 6) {
    return c.json({ error: 'Email valid dan password minimal 6 karakter diperlukan.' }, 400)
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    return c.json({ error: 'Email sudah terdaftar.' }, 409)
  }

  const { hash, salt } = await hashPassword(password)
  const userId = crypto.randomUUID()

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: hash,
    salt,
  })

  const initialTasks = [
    {
      id: crypto.randomUUID(),
      userId,
      columnId: 'todo' as const,
      title: 'Pelajari arsitektur Cloudflare D1',
      description: 'Cek integrasi Drizzle dengan D1 database.',
      position: 0,
    },
    {
      id: crypto.randomUUID(),
      userId,
      columnId: 'in_progress' as const,
      title: 'Uji fitur drag and drop',
      description: 'Pastikan perpindahan kartu dan reordering berjalan mulus.',
      position: 0,
    },
    {
      id: crypto.randomUUID(),
      userId,
      columnId: 'done' as const,
      title: 'Inisialisasi project Kanban',
      description: 'Setup Vite, Tailwind, dan Cloudflare Pages Functions.',
      position: 0,
    },
  ]
  for (const t of initialTasks) {
    await db.insert(tasks).values(t)
  }

  const secret = c.env.JWT_SECRET || 'dev-secret-key-kanban-board-change-in-prod'
  const token = await sign(
    { userId, email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret,
    'HS256'
  )

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ user: { id: userId, email } }, 201)
})

app.post('/auth/login', async (c) => {
  const db = drizzle(c.env.DB)
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({}))
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !password) {
    return c.json({ error: 'Email dan password wajib diisi.' }, 400)
  }

  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) {
    return c.json({ error: 'Email atau password salah.' }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash, user.salt)
  if (!valid) {
    return c.json({ error: 'Email atau password salah.' }, 401)
  }

  const secret = c.env.JWT_SECRET || 'dev-secret-key-kanban-board-change-in-prod'
  const token = await sign(
    { userId: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret,
    'HS256'
  )

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return c.json({ user: { id: user.id, email: user.email } })
})

app.post('/auth/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ success: true })
})

app.get('/auth/me', async (c) => {
  const secret = c.env.JWT_SECRET || 'dev-secret-key-kanban-board-change-in-prod'
  const token = getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ user: null })
  }

  try {
    const payload = (await verify(token, secret, 'HS256')) as { userId: string; email: string }
    return c.json({ user: { id: payload.userId, email: payload.email } })
  } catch {
    return c.json({ user: null })
  }
})

// === TASKS CRUD & REORDER ROUTES ===

app.get('/tasks', async (c) => {
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')

  const list = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))

  return c.json({ tasks: list })
})

app.post('/tasks', async (c) => {
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')
  const body = await c
    .req.json<{ columnId?: 'todo' | 'in_progress' | 'done'; title?: string; description?: string }>()
    .catch(() => ({}))

  const columnId = body.columnId || 'todo'
  const title = body.title?.trim()
  const description = body.description?.trim() || ''

  if (!title) {
    return c.json({ error: 'Judul tugas wajib diisi.' }, 400)
  }

  if (!['todo', 'in_progress', 'done'].includes(columnId)) {
    return c.json({ error: 'Kolom tujuan tidak valid.' }, 400)
  }

  const existingInColumn = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.columnId, columnId)))

  const position = existingInColumn.length
  const taskId = crypto.randomUUID()

  const newTask = {
    id: taskId,
    userId,
    columnId,
    title,
    description,
    position,
  }

  await db.insert(tasks).values(newTask)
  return c.json({ task: newTask }, 201)
})

app.put('/tasks/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')
  const id = c.req.param('id')
  const body = await c.req.json<{ title?: string; description?: string }>().catch(() => ({}))

  const title = body.title?.trim()
  const description = body.description?.trim()

  if (!title) {
    return c.json({ error: 'Judul tugas wajib diisi.' }, 400)
  }

  const existing = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .get()
  if (!existing) {
    return c.json({ error: 'Tugas tidak ditemukan.' }, 404)
  }

  await db
    .update(tasks)
    .set({
      title,
      description: description !== undefined ? description : existing.description,
      updatedAt: sql`(unixepoch())`,
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))

  return c.json({ success: true })
})

app.delete('/tasks/:id', async (c) => {
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')
  const id = c.req.param('id')

  const existing = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .get()
  if (!existing) {
    return c.json({ error: 'Tugas tidak ditemukan.' }, 404)
  }

  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
  return c.json({ success: true })
})

app.patch('/tasks/reorder', async (c) => {
  const db = drizzle(c.env.DB)
  const userId = c.get('userId')
  const body = await c
    .req.json<{
      items?: Array<{ id: string; columnId: 'todo' | 'in_progress' | 'done'; position: number }>
    }>()
    .catch(() => ({}))

  const items = body.items
  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: 'Daftar pembaruan posisi tidak valid.' }, 400)
  }

  const statements = items.map((item) =>
    db
      .update(tasks)
      .set({
        columnId: item.columnId,
        position: item.position,
        updatedAt: sql`(unixepoch())`,
      })
      .where(and(eq(tasks.id, item.id), eq(tasks.userId, userId)))
  )

  await db.batch(statements as any)

  return c.json({ success: true })
})

export const onRequest: PagesFunction<Bindings> = async (context) => {
  return app.fetch(context.request, context.env, context)
}
