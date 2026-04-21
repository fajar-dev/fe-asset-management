import * as z from 'zod'

export const maintenanceSchema = z.object({
  maintenanceAt: z.string().min(1, 'Date is required'),
  note: z.string().min(1, 'Note is required')
})

export type MaintenanceSchema = z.output<typeof maintenanceSchema>
