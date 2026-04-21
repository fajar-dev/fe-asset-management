import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

export interface Category {
  data?: any
  id: string
  name: string
  hasLocation: boolean
  hasMaintenance: boolean
  hasHolder: boolean
}

export type CategoryResponse = ApiListResponse<Category>
export type CategoryDetailResponse = ApiDetailResponse<Category>

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
