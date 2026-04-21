import type { Branch } from './branch'
import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

export interface Location {
  locationUuid: any
  id: string
  name: string
  branch: Branch
}

export type LocationResponse = ApiListResponse<Location>
export type LocationDetailResponse = ApiDetailResponse<Location>

export interface CreateLocationPayload {
  name: string
  branchId: string
}

export interface UpdateLocationPayload extends Partial<CreateLocationPayload> {
  id?: string
}

export type { Pagination }
