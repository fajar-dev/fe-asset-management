import * as z from 'zod'

export const assetStatusSchema = z.object({
  type: z.enum(['active', 'inactive']),
  note: z.string().optional(),
  isTransferred: z.boolean().optional(),
  attachments: z.array(z.instanceof(File)).optional()
})

export type AssetStatusSchema = z.output<typeof assetStatusSchema>
