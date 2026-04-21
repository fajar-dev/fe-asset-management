import * as z from 'zod'

export const noteSchema = z.object({
  occuredAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})

export type NoteSchema = z.output<typeof noteSchema>
