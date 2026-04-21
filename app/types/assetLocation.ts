import type { Pagination } from './api'

export interface CreateAssetLocationPayload {
  locationId: string
}

export interface AssetLocationDetail {
  id: string
  name: string
  branch: string
}

export interface AssetLocation {
  id: string
  location: AssetLocationDetail
}

export interface AssetLocationResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetLocation[]
  meta: {
    pagination: Pagination
  }
}

export type { Pagination }
