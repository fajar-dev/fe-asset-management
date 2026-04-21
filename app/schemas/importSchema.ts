import * as z from 'zod'

export const assetImportSchema = z.object({
  file: z.any().refine(file => file !== null && file !== undefined, {
    message: 'Asset image is required'
  })
})

export const assetLocationSelectSchema = z.object({
  locationId: z.string().min(1, 'Location is required')
})

export type AssetImportSchema = z.output<typeof assetImportSchema>
export type AssetLocationSelectSchema = z.output<typeof assetLocationSelectSchema>
