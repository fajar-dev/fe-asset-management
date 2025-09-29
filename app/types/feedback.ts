export type FeedbackType = 'keluhan' | 'saran' | 'pujian'

export interface Feedback {
  id: string
  type: FeedbackType
  description: string
  imageUrls?: string[]
  createdAt: string
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
