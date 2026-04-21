import type { ApiListResponse, Pagination } from './api'

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

export type AssetLocationResponse = ApiListResponse<AssetLocation>

export type { Pagination }
