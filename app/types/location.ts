import type { Branch } from './branch'
import type { Pagination } from './api'

export interface Location {
  locationUuid: any
  id: string
  name: string
  branch: Branch
}

export interface LocationResponse {
  success: boolean
  statusCode: number
  message: string
  data: Location[]
  meta: {
    pagination: Pagination
  }
}

export interface LocationDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: Location
}

export interface CreateLocationPayload {
  name: string
  branchId: string
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  id?: string
}

export type { Pagination }
