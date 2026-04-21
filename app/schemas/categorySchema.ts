import * as z from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hasLocation: z.boolean().default(false),
  hasMaintenance: z.boolean().default(false),
  hasHolder: z.boolean().default(false)
})

export type CategorySchema = z.output<typeof categorySchema>
