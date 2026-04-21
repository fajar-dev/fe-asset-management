import * as z from 'zod'
import { categorySchema, type CategorySchema } from './categorySchema'
import { propertySchema } from './subCategorySchema'
import { locationSchema as assetLocationSchema, type LocationSchema as AssetLocationSchema } from './locationSchema'

export { categorySchema, type CategorySchema }
export { assetLocationSchema, type AssetLocationSchema }

const propertyEntry = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number()]).optional()
})

const labelEntry = z.object({
  key: z.string().min(1, 'Label key is required'),
  value: z.string().min(1, 'Label value is required')
})

const labelSuperRefine = (data: { labels?: { key: string; value: string }[] }, ctx: z.RefinementCtx) => {
  if (data.labels) {
    const keys = new Map<string, number[]>()
    data.labels.forEach((item, index) => {
      const k = item.key.toLowerCase().trim()
      if (k) {
        if (!keys.has(k)) keys.set(k, [])
        keys.get(k)!.push(index)
      }
    })
  }
}

export const subCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  properties: z.array(propertySchema)
})

export type SubCategorySchema = z.infer<typeof subCategorySchema>

export const createAssetSchema = z.object({
  codes: z.array(z.string().min(1, 'Asset code is required')).min(1, 'At least one code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  user: z.string().min(1, 'User is required'),
  price: z.union([z.string(), z.number()]).refine(val => val !== undefined && val !== '', {
    message: 'Price is required'
  }),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  locationId: z.string().optional(),
  isLendable: z.boolean().default(false),
  image: z.any().refine(file => file !== null && file !== undefined, {
    message: 'Asset image is required'
  }),
  properties: z.array(propertyEntry).optional(),
  labels: z.array(labelEntry).optional()
}).superRefine(labelSuperRefine)

export const updateAssetSchema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Asset name is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  user: z.string().min(1, 'User is required'),
  price: z.union([z.string(), z.number()]).refine(val => val !== undefined && val !== '', {
    message: 'Price is required'
  }),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  categoryId: z.string().min(1, 'Category is required'),
  subCategoryId: z.string().min(1, 'Sub category is required'),
  isLendable: z.boolean().default(false),
  image: z.any().optional(),
  properties: z.array(propertyEntry).optional(),
  labels: z.array(labelEntry).optional()
}).superRefine(labelSuperRefine)

export type CreateAssetSchema = z.output<typeof createAssetSchema>
export type UpdateAssetSchema = z.output<typeof updateAssetSchema>
