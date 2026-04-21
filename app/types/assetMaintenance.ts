import type { ApiListResponse, ApiDetailResponse, Pagination } from './api'

export interface AssetMaintenance {
  id: string
  assetUuid: string
  maintenanceAt: string
  note: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateAssetMaintenancePayload {
  maintenanceAt: string
  note: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateAssetMaintenancePayload extends Partial<CreateAssetMaintenancePayload> {}

export type AssetMaintenanceResponse = ApiListResponse<AssetMaintenance>
export type AssetMaintenanceDetailResponse = ApiDetailResponse<AssetMaintenance>

export type { Pagination }
