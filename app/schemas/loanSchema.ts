import * as z from 'zod'

export const requestLoanSchema = z.object({
  purpose: z.string().min(1, 'Purpose is required'),
  image: z.custom<File>((val) => val instanceof File, 'Photo is required')
})

export const returnLoanSchema = z.object({
  image: z.custom<File>((val) => val instanceof File, 'Photo is required')
})

export type RequestLoanSchema = z.output<typeof requestLoanSchema>
export type ReturnLoanSchema = z.output<typeof returnLoanSchema>
