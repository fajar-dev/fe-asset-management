import * as z from 'zod'

export const assetStatusSchema = z.object({
  type: z.enum(['active', 'sold', 'granted', 'disposed']),
  note: z.string().optional()
})

export type AssetStatusSchema = z.output<typeof assetStatusSchema>
