import * as z from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  branchId: z.string().min(1, 'Branch is required')
})

export type LocationSchema = z.output<typeof locationSchema>
