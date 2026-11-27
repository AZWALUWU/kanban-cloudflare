import { sqliteTable, text, integer, real, index, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
})

export const boardMembers = sqliteTable('board_members', {
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'member'] }).notNull(),
  invitedBy: text('invited_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => [primaryKey({ columns: [table.boardId, table.userId] }), index('idx_board_members_user').on(table.userId)])

export const columns = sqliteTable('columns', {
  id: text('id', { enum: ['todo', 'in_progress', 'done'] }).notNull(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: real('position').notNull(),
}, (table) => [primaryKey({ columns: [table.boardId, table.id] }), index('idx_columns_board').on(table.boardId)])

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  boardId: text('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  columnId: text('column_id', { enum: ['todo', 'in_progress', 'done'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  dueDate: text('due_date'),
  position: real('position').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => [index('idx_tasks_board_column').on(table.boardId, table.columnId), index('idx_tasks_board_position').on(table.boardId, table.columnId, table.position)])

export const taskChecklists = sqliteTable('task_checklists', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull(),
}, (table) => [index('idx_checklists_task').on(table.taskId, table.position)])

export type User = typeof users.$inferSelect
export type Board = typeof boards.$inferSelect
export type BoardMember = typeof boardMembers.$inferSelect
export type Column = typeof columns.$inferSelect
export type Task = typeof tasks.$inferSelect
export type TaskChecklist = typeof taskChecklists.$inferSelect
