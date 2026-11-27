import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().email().max(254)
export const passwordSchema = z.string().min(8).max(128)
export const columnIdSchema = z.enum(['todo', 'in_progress', 'done'])
export const prioritySchema = z.enum(['low', 'medium', 'high'])
export const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10000).default(''),
  columnId: columnIdSchema.default('todo'),
  priority: prioritySchema.default('medium'),
  dueDate: z.string().date().nullable().optional(),
  checklist: z.array(z.object({ id: z.string().optional(), text: z.string().trim().min(1).max(300), completed: z.boolean().default(false) })).max(50).default([]),
})
export const boardSchema = z.object({ name: z.string().trim().min(1).max(80) })
export const inviteSchema = z.object({ email: emailSchema })
export const reorderSchema = z.object({
  id: z.string().min(1).max(100),
  columnId: columnIdSchema,
  position: z.number().finite(),
})
