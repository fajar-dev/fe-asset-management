import * as z from 'zod'

export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  dataType: z.enum(['string', 'number'], { message: 'Type is required' })
})

export const createSubCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  labels: z.array(z.string()).optional(),
  properties: z.array(propertySchema)
})

export const updateSubCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  labels: z.array(z.string()).optional()
})

export type PropertySchema = z.output<typeof propertySchema>
export type CreateSubCategorySchema = z.output<typeof createSubCategorySchema>
export type UpdateSubCategorySchema = z.output<typeof updateSubCategorySchema>
