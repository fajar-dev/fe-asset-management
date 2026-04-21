import * as z from 'zod'

export const assignHolderSchema = z.object({
  assignedAt: z.string().min(1, 'Assigned date is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  attachments: z.array(z.custom<File>((val) => val instanceof File, 'Must be a File')).optional()
})

export const returnHolderSchema = z.object({
  returnedAt: z.string().min(1, 'Returned date is required'),
  attachments: z.array(z.custom<File>((val) => val instanceof File, 'Must be a File')).optional()
})

export type AssignHolderSchema = z.output<typeof assignHolderSchema>
export type ReturnHolderSchema = z.output<typeof returnHolderSchema>
