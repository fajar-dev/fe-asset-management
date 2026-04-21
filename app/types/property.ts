import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

export interface Property {
  id: string
  name: string
  dataType: 'string' | 'number'
}

export interface CreatePropertyPayload {
  name: string
  dataType: 'string' | 'number'
}

export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  id?: string
}

export type PropertyResponse = ApiListResponse<Property>
export type PropertyDetailResponse = ApiDetailResponse<Property>

export type { Pagination }
