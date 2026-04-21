import type { Pagination } from './api'

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

export interface PropertyResponse {
  success: boolean
  statusCode: number
  message: string
  data: Property[]
  meta?: {
    pagination?: Pagination
  }
}

export interface PropertyDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Property
}

export type { Pagination }
