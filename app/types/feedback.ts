import type { Pagination } from './api'

export type FeedbackType = 'keluhan' | 'saran' | 'pujian'

export const FeedbackTypeColor: Record<FeedbackType, string> = {
  keluhan: 'error',
  saran: 'secondary',
  pujian: 'success'
}

export type FeedbackStatus
  = | 'New'
    | 'Ignored'
    | 'Noted'
    | 'Need Discussion'
    | 'Accepted'
    | 'In Progress'
    | 'Done'

export const FeedbackStatusColor: Record<FeedbackStatus, string> = {
  'New': 'primary',
  'Ignored': 'neutral',
  'Noted': 'warning',
  'Need Discussion': 'secondary',
  'Accepted': 'success',
  'In Progress': 'info',
  'Done': 'success'
}

export interface Feedback {
  id?: string
  type: FeedbackType
  description: string
  imageUrls?: string[]
  createdAt: string
  updatedAt?: string
  reply?: string
  status?: FeedbackStatus
  email?: string
  url?: string
}

export interface FeedbackRaw {
  timestamp: string
  email: string
  image?: string[]
  imageUrls?: string[]
  url: string
  category: FeedbackType
  message: string
  status: FeedbackStatus
  reply: string
}

export interface FeedbackDetailResponse {
  data: Feedback
}

export interface FeedbackResponse {
  data: FeedbackRaw[]
  meta?: {
    pagination: Pagination
  }
}

export interface CreateFeedbackPayload {
  url: string
  type: FeedbackType
  description: string
  images?: File[]
}

export interface UpdateFeedbackPayload {
  status: FeedbackStatus
  reply: string
}

export type { Pagination }
