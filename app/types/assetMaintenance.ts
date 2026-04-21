import type { Pagination } from './api'

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

export interface AssetMaintenanceResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetMaintenance[]
  meta?: {
    pagination: Pagination
  }
}

export interface AssetMaintenanceDetailResponse {
  success: boolean
  statusCode: number
  message: string
  data: AssetMaintenance
}

export type { Pagination }
