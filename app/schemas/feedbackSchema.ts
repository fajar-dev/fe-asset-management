import * as z from 'zod'

export const feedbackSchema = z.object({
  url: z.string().min(1, 'Url is required'),
  type: z.enum(['keluhan', 'saran', 'pujian']),
  description: z.string().min(1, 'Description is required'),
  images: z.array(z.instanceof(File)).min(1, 'At least 1 image is required').max(3, 'Maximum 3 images allowed')
})

export type FeedbackSchema = z.infer<typeof feedbackSchema>
