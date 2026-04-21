import type { Pagination } from './api'

export interface Category {
  data?: any
  id: string
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export interface CategoryResponse {
  success: boolean
  statusCode: number
  message: string
  data: Category[]
  meta: {
    pagination: Pagination
  }
}

export interface CategoryDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Category
}

export interface CreateCategoryPayload {
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {
  id?: string
}

export type { Pagination }
