export type FeedbackType = 'keluhan' | 'saran' | 'pujian'

export const FeedbackTypeColor: Record<FeedbackType, string> = {
  keluhan: 'error',
  saran: 'secondary',
  pujian: 'success'
}

export type FeedbackStatus
  = | 'new'
    | 'ignored'
    | 'noted'
    | 'need discussion'
    | 'accepted'
    | 'in progress'
    | 'done'

export const FeedbackStatusColor: Record<FeedbackStatus, string> = {
  'new': 'primary',
  'ignored': 'neutral',
  'noted': 'warning',
  'need discussion': 'secondary',
  'accepted': 'success',
  'in progress': 'info',
  'done': 'success'
}

export interface Feedback {
  id: string
  type: FeedbackType
  description: string
  imageUrls?: string[]
  createdAt: string
  updatedAt: string
  reply?: string
  status?: FeedbackStatus
  user: any
}

export interface FeedbackDetailResponse {
  data: Feedback
}

export interface FeedbackResponse {
  data: Feedback[]
  meta?: {
    pagination: Pagination
  }
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  pageCount: number
}

export interface CreateFeedbackPayload {
  type: FeedbackType
  description: string
  images?: File[]
}

export interface UpdateFeedbackPayload {
  status: FeedbackStatus
  reply: string
}
